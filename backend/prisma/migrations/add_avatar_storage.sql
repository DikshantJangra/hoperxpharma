-- CreateTable: UserAvatar
CREATE TABLE IF NOT EXISTS "UserAvatar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAvatar_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AvatarObject
CREATE TABLE IF NOT EXISTS "AvatarObject" (
    "sha" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "refCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessed" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvatarObject_pkey" PRIMARY KEY ("sha")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserAvatar_userId_isActive_idx" ON "UserAvatar"("userId", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserAvatar_sha_idx" ON "UserAvatar"("sha");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AvatarObject_refCount_idx" ON "AvatarObject"("refCount");

-- AddForeignKey
ALTER TABLE "UserAvatar" ADD CONSTRAINT "UserAvatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
