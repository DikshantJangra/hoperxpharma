#!/usr/bin/env python3
"""
Simple Route Verification Tracker Generator
Extracts all routes from Next.js app and creates a simple CSV for tracking
"""

import os
import csv
from pathlib import Path

def extract_routes_from_app_directory(app_dir):
    """Extract all routes from Next.js app directory"""
    routes = []
    
    for root, dirs, files in os.walk(app_dir):
        if 'page.tsx' in files:
            # Get relative path from app directory
            rel_path = os.path.relpath(root, app_dir)
            
            # Convert file system path to URL route
            if rel_path == '.':
                route = '/'
            else:
                # Remove route groups like (auth), (main), etc.
                parts = rel_path.split(os.sep)
                clean_parts = [p for p in parts if not (p.startswith('(') and p.endswith(')'))]
                
                if not clean_parts:
                    route = '/'
                else:
                    route = '/' + '/'.join(clean_parts)
            
            routes.append(route)
    
    return sorted(set(routes))

def categorize_and_order_routes(routes):
    """Order routes by user workflow"""
    
    # Define workflow order
    workflow_order = {
        # 1. Authentication & Onboarding
        'auth': ['/', '/login', '/signup', '/verify-magic-link'],
        
        # 2. Dashboard (Entry Point)
        'dashboard': ['/dashboard', '/dashboard/overview', '/dashboard/summary', '/dashboard/alerts'],
        
        # 3. Core Operations - POS
        'pos': ['/pos', '/pos/cart', '/pos/returns'],
        
        # 4. Inventory Management
        'inventory': [
            '/inventory', '/inventory/stock', '/inventory/add', '/inventory/edit',
            '/inventory/batches', '/inventory/expiry', '/inventory/adjustments',
            '/inventory/maintenance', '/inventory/forecast'
        ],
        
        # 5. Purchasing
        'purchasing': [
            '/purchasing', '/purchasing/orders', '/purchasing/new',
            '/purchasing/receiving', '/purchasing/suppliers'
        ],
        
        # 6. Dispensing (Pharmacy Workflow)
        'dispense': [
            '/dispense', '/dispense/queue', '/dispense/intake',
            '/dispense/fill', '/dispense/check', '/dispense/verify',
            '/dispense/label', '/dispense/release', '/dispense/dispense'
        ],
        
        # 7. Patients
        'patients': ['/patients', '/patients/list', '/patients/profile', '/patients/history'],
        
        # 8. Prescriptions
        'prescriptions': ['/prescriptions', '/prescriptions/new', '/prescriptions/verify', '/prescriptions/history'],
        
        # 9. Sales & Finance
        'sales': ['/sales', '/sales/history', '/sales/returns'],
        'finance': ['/finance', '/finance/sales', '/finance/expenses', '/finance/credit', '/finance/reconcile'],
        
        # 10. GST & Compliance
        'gst': [
            '/gst', '/gst/dashboard', '/gst/invoices', '/gst/invoices/new',
            '/gst/returns', '/gst/filings', '/gst/hsn-codes', '/gst/tax-slabs',
            '/gst/mismatches', '/gst/exports'
        ],
        
        # 11. Claims
        'claims': ['/claims/customer', '/claims/insurance', '/claims/supplier'],
        
        # 12. Insights & Analytics
        'insights': [
            '/insights/adherence', '/insights/analytics', '/insights/drug-trends',
            '/insights/patient', '/insights/performance', '/insights/sales'
        ],
        
        # 13. Reports
        'reports': [
            '/reports', '/reports/inventory', '/reports/sales', '/reports/financial',
            '/reports/compliance', '/reports/custom'
        ],
        
        # 14. Communication
        'messages': ['/messages/email', '/messages/sms', '/messages/templates'],
        'engage': ['/engage/campaigns', '/engage/coupons', '/engage/loyalty', '/engage/feedback'],
        
        # 15. Settings & Configuration
        'settings': [
            '/settings', '/settings/account', '/settings/billing', '/settings/integrations',
            '/settings/notifications', '/settings/profile', '/settings/stores', '/settings/team'
        ],
        
        # 16. Audit & Compliance
        'audit': ['/audit/access', '/audit/activity-log', '/audit/exports'],
        
        # 17. Administration
        'admin': ['/staff', '/suppliers'],
        
        # 18. Alerts & Notifications
        'alerts': ['/alerts', '/alerts/preferences'],
        
        # 19. Help & Support
        'help': ['/help/chat', '/help/docs', '/help/feedback', '/help/updates'],
        
        # 20. Behavioral (last as it's auxiliary)
        'behavioral': ['/behavioral'],
        
        # 21. Upgrade/Billing
        'upgrade': ['/upgrade']
    }
    
    # Create ordered list
    ordered_routes = []
    used_routes = set()
    
    # Add routes in workflow order
    for category, category_routes in workflow_order.items():
        for route in category_routes:
            if route in routes:
                ordered_routes.append(route)
                used_routes.add(route)
    
    # Add any remaining routes not in workflow order
    for route in sorted(routes):
        if route not in used_routes:
            ordered_routes.append(route)
    
    return ordered_routes

def determine_feature_category(route):
    """Determine feature category for a route"""
    if '/login' in route or '/signup' in route or '/verify' in route:
        return 'Auth'
    elif '/dashboard' in route:
        return 'Dashboard'
    elif '/pos' in route:
        return 'POS'
    elif '/inventory' in route:
        return 'Inventory'
    elif '/purchasing' in route:
        return 'Purchasing'
    elif '/dispense' in route:
        return 'Dispensing'
    elif '/patients' in route:
        return 'Patients'
    elif '/prescriptions' in route:
        return 'Prescriptions'
    elif '/sales' in route:
        return 'Sales'
    elif '/finance' in route:
        return 'Finance'
    elif '/gst' in route:
        return 'GST/Compliance'
    elif '/claims' in route:
        return 'Claims'
    elif '/insights' in route:
        return 'Insights'
    elif '/reports' in route:
        return 'Reports'
    elif '/messages' in route or '/engage' in route:
        return 'Communication'
    elif '/settings' in route:
        return 'Settings'
    elif '/audit' in route:
        return 'Audit'
    elif '/staff' in route or '/suppliers' in route:
        return 'Admin'
    elif '/alerts' in route:
        return 'Alerts'
    elif '/help' in route:
        return 'Help'
    elif '/upgrade' in route:
        return 'Billing'
    else:
        return 'Other'

def create_csv_tracker(routes, output_path):
    """Create CSV tracker with all routes"""
    
    with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        
        # Header row
        writer.writerow([
            'Route/Path',
            'Feature Category',
            'Description',
            'Dev Verified',
            'Tester Verified',
            'Status',
            'Bugs',
            'Future Updates',
            'Notes'
        ])
        
        # Data rows
        for route in routes:
            category = determine_feature_category(route)
            
            # Generate description from route
            route_parts = route.strip('/').split('/')
            if not route_parts or route_parts == ['']:
                description = 'Landing Page'
            else:
                description = ' > '.join([p.replace('-', ' ').title() for p in route_parts])
            
            writer.writerow([
                route,
                category,
                description,
                '',  # Dev Verified (empty for user to fill)
                '',  # Tester Verified (empty for user to fill)
                '',  # Status (empty for user to fill)
                '',  # Bugs (empty for user to fill)
                '',  # Future Updates (empty for user to fill)
                ''   # Notes (empty for user to fill)
            ])

def main():
    app_dir = '/Users/dikshantjangra/Desktop/hoperxpharma/app'
    output_path = '/Users/dikshantjangra/Desktop/hoperxpharma/Route_Verification_Tracker.csv'
    
    print("🔍 Scanning Next.js app directory...")
    routes = extract_routes_from_app_directory(app_dir)
    
    print(f"📊 Found {len(routes)} unique routes")
    
    print("🔄 Ordering routes by user workflow...")
    ordered_routes = categorize_and_order_routes(routes)
    
    print("📝 Creating CSV tracker...")
    create_csv_tracker(ordered_routes, output_path)
    
    print(f"✅ CSV created successfully: {output_path}")
    print(f"📋 Total routes: {len(ordered_routes)}")
    print("\n📖 Column Guide:")
    print("  - Dev Verified: Use ✓ (working), - (in progress), or leave empty")
    print("  - Tester Verified: Use ✓ (working), - (in progress), or leave empty")
    print("  - Status: Current state of the route")
    print("  - Bugs: Known issues")
    print("  - Future Updates: Planned improvements")
    print("  - Notes: Additional context")

if __name__ == "__main__":
    main()
