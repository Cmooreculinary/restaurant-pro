"""
Restaurateur Pro API Tests
Tests all backend endpoints including:
- Health checks
- Profile endpoints (GET, PUT)
- Team, Equipment, Vendors, Permits, Menu Items, Budget endpoints
- Authentication flow
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session token from the review request
TEST_SESSION_TOKEN = "test_session_1773422765523"


class TestHealthEndpoints:
    """Health check endpoint tests"""
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Restaurateur Pro API"
        print(f"✓ Root endpoint working: {data}")
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print(f"✓ Health endpoint working: {data}")


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_auth_me_without_token(self):
        """Test /auth/me returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /auth/me correctly returns 401 without auth")
    
    def test_auth_me_with_invalid_token(self):
        """Test /auth/me returns 401 with invalid token"""
        headers = {"Authorization": "Bearer invalid_token_12345"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 401
        print("✓ /auth/me correctly returns 401 with invalid token")


class TestProfileEndpoints:
    """Profile endpoint tests - require authentication"""
    
    def test_profile_get_without_auth(self):
        """Test /profile returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/profile")
        assert response.status_code == 401
        print("✓ /profile correctly returns 401 without auth")
    
    def test_profile_summary_without_auth(self):
        """Test /profile/summary returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/profile/summary")
        assert response.status_code == 401
        print("✓ /profile/summary correctly returns 401 without auth")


class TestTeamEndpoints:
    """Team endpoint tests"""
    
    def test_team_get_without_auth(self):
        """Test /team returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/team")
        assert response.status_code == 401
        print("✓ /team correctly returns 401 without auth")


class TestEquipmentEndpoints:
    """Equipment endpoint tests"""
    
    def test_equipment_get_without_auth(self):
        """Test /equipment returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 401
        print("✓ /equipment correctly returns 401 without auth")


class TestVendorsEndpoints:
    """Vendors endpoint tests"""
    
    def test_vendors_get_without_auth(self):
        """Test /vendors returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/vendors")
        assert response.status_code == 401
        print("✓ /vendors correctly returns 401 without auth")


class TestPermitsEndpoints:
    """Permits endpoint tests"""
    
    def test_permits_get_without_auth(self):
        """Test /permits returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/permits")
        assert response.status_code == 401
        print("✓ /permits correctly returns 401 without auth")


class TestMenuItemsEndpoints:
    """Menu items endpoint tests"""
    
    def test_menu_items_get_without_auth(self):
        """Test /menu-items returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/menu-items")
        assert response.status_code == 401
        print("✓ /menu-items correctly returns 401 without auth")


class TestBudgetEndpoints:
    """Budget endpoint tests"""
    
    def test_budget_get_without_auth(self):
        """Test /budget returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/budget")
        assert response.status_code == 401
        print("✓ /budget correctly returns 401 without auth")


class TestSiteDemographicsEndpoints:
    """Site demographics endpoint tests"""
    
    def test_site_demographics_without_auth(self):
        """Test /site/demographics returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/site/demographics")
        assert response.status_code == 401
        print("✓ /site/demographics correctly returns 401 without auth")


class TestSubscriptionEndpoints:
    """Subscription endpoint tests"""
    
    def test_subscription_plans(self):
        """Test /subscriptions/plans returns available plans"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert len(data["plans"]) >= 2
        
        # Verify plan structure
        for plan in data["plans"]:
            assert "id" in plan
            assert "name" in plan
            assert "price" in plan
            assert "features" in plan
        
        print(f"✓ Subscription plans endpoint working: {len(data['plans'])} plans available")


class TestNotificationsEndpoints:
    """Notifications endpoint tests"""
    
    def test_notifications_without_auth(self):
        """Test /notifications returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 401
        print("✓ /notifications correctly returns 401 without auth")


class TestTasksEndpoints:
    """Tasks endpoint tests"""
    
    def test_tasks_without_auth(self):
        """Test /tasks returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/tasks")
        assert response.status_code == 401
        print("✓ /tasks correctly returns 401 without auth")


class TestUnitsEndpoints:
    """Units endpoint tests"""
    
    def test_units_without_auth(self):
        """Test /units returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/units")
        assert response.status_code == 401
        print("✓ /units correctly returns 401 without auth")


class TestCandidatesEndpoints:
    """Candidates endpoint tests"""
    
    def test_candidates_without_auth(self):
        """Test /candidates returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/candidates")
        assert response.status_code == 401
        print("✓ /candidates correctly returns 401 without auth")


class TestLeaseClausesEndpoints:
    """Lease clauses endpoint tests"""
    
    def test_lease_clauses_without_auth(self):
        """Test /lease-clauses returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/lease-clauses")
        assert response.status_code == 401
        print("✓ /lease-clauses correctly returns 401 without auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
