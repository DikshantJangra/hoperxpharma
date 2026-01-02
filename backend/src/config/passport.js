const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database');
const prisma = db.getClient();
const logger = require('./logger');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.API_BASE_URL}/v1/auth/google/callback`,
            prompt: 'select_account',
            passReqToCallback: true, // Enable access to req (and query.state)
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                // Get intent from state (passed from /google route)
                // Google returns state in query params of the callback request
                const intent = req.query.state || 'login';

                // Robust profile extraction
                const email = profile.emails?.[0]?.value;
                const firstName = profile.name?.givenName || email?.split('@')[0] || 'User';
                const lastName = profile.name?.familyName || ' ';

                if (!email) {
                    logger.error('Google OAuth: No email provided');
                    return done(null, false);
                }

                logger.info(`Google ${intent} attempt: ${email}`);

                // Check if user exists
                let user = await prisma.user.findUnique({
                    where: { email },
                    include: {
                        storeUsers: {
                            include: {
                                store: true
                            }
                        }
                    }
                });

                // STRICT LOGIN ENFORCEMENT - DISABLED to allow auto-signup
                // if (intent === 'login' && !user) {
                //     logger.warn(`Login failed: User ${email} does not exist.`);
                //     return done(null, false, { message: 'Account not found. Please sign up.' });
                // }

                if (user) {
                    logger.info(`User found: ${user.email}`);
                    return done(null, user);
                }

                // SIGNUP LOGIC (Only runs if intent != 'login' AND user doesn't exist)
                logger.info(`Creating new user from Google: ${email}`);

                const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                const placeholderPhone = `000-${uniqueId}`;

                user = await prisma.user.create({
                    data: {
                        email,
                        firstName,
                        lastName,
                        phoneNumber: placeholderPhone,
                        passwordHash: 'oauth_user',
                        role: 'ADMIN',
                        onboarding: {
                            create: {
                                currentStep: 1,
                                isComplete: false,
                                mode: null, // Explicitly null to trigger Welcome screen
                                completedSteps: [],
                                data: {}
                            }
                        }
                    },
                    include: {
                        storeUsers: {
                            include: {
                                store: true
                            }
                        },
                        onboarding: true
                    }
                });

                return done(null, user);
            } catch (error) {
                logger.error('Google OAuth Error:', error);
                return done(null, false, { message: 'Authentication failed' });
            }
        }
    )
);

// Serialize user for session (or JWT)
// Since we use JWT, we might not need session serialization if we manually issue token in callback.
// But Passport usually requires these for session support. 
// We will skip session support in route config `session: false`.
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, { id }));

module.exports = passport;
