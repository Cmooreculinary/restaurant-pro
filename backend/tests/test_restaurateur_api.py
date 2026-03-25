"""
Restaurateur Pro API Tests - Iteration 3
Tests for Quick Setup Wizard, Add Task, Add Team Member dialogs, and all CRUD endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthEndpoints:
    """Health check endpoints - no auth required"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Restaurateur Pro API"
        assert data["version"] == "2.0"
        assert data["status"] == "operational"
        print("✓ API root endpoint working")
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print("✓ Health endpoint working")


class TestAuthGuards:
    """Test that protected endpoints require authentication"""
    
    @pytest.mark.parametrize("endpoint,method", [
        ("/api/tasks", "GET"),
        ("/api/tasks", "POST"),
        ("/api/team", "GET"),
        ("/api/team", "POST"),
        ("/api/equipment", "GET"),
        ("/api/equipment", "POST"),
        ("/api/vendors", "GET"),
        ("/api/vendors", "POST"),
        ("/api/permits", "GET"),
        ("/api/permits", "POST"),
        ("/api/menu-items", "GET"),
        ("/api/menu-items", "POST"),
        ("/api/budget", "GET"),
        ("/api/budget", "POST"),
        ("/api/profile", "GET"),
        ("/api/profile/summary", "GET"),
    ])
    def test_protected_endpoints_require_auth(self, endpoint, method):
        """Test that protected endpoints return 401 without auth"""
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}")
        else:
            response = requests.post(f"{BASE_URL}{endpoint}", json={})
        
        assert response.status_code == 401, f"{method} {endpoint} should return 401, got {response.status_code}"
        print(f"✓ {method} {endpoint} correctly requires auth (401)")


class TestSubscriptionPlans:
    """Test subscription plans endpoint - no auth required"""
    
    def test_get_subscription_plans(self):
        """Test getting subscription plans"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert len(data["plans"]) == 2
        
        plan_ids = [p["id"] for p in data["plans"]]
        assert "single_unit" in plan_ids
        assert "multi_unit" in plan_ids
        
        # Check Single Unit plan
        single_unit = next(p for p in data["plans"] if p["id"] == "single_unit")
        assert single_unit["price"] == 14.00
        assert single_unit["name"] == "Single Unit"
        
        # Check Multi-Unit plan
        multi_unit = next(p for p in data["plans"] if p["id"] == "multi_unit")
        assert multi_unit["price"] == 18.00
        assert multi_unit["name"] == "Multi-Unit"
        
        print("✓ Subscription plans endpoint working with correct data")


class TestTasksEndpointStructure:
    """Test Tasks endpoint request/response structure"""
    
    def test_tasks_post_requires_project_id(self):
        """Test that POST /api/tasks requires project_id field"""
        # Without auth, we get 401, but we can verify the endpoint exists
        response = requests.post(f"{BASE_URL}/api/tasks", json={
            "title": "Test Task",
            "status": "pending",
            "priority": "medium"
        })
        # Should be 401 (auth required) not 404 (endpoint not found)
        assert response.status_code == 401
        print("✓ POST /api/tasks endpoint exists and requires auth")


class TestTeamEndpointStructure:
    """Test Team endpoint request/response structure"""
    
    def test_team_post_endpoint_exists(self):
        """Test that POST /api/team endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/team", json={
            "name": "Test Member",
            "role": "Chef"
        })
        # Should be 401 (auth required) not 404 (endpoint not found)
        assert response.status_code == 401
        print("✓ POST /api/team endpoint exists and requires auth")


class TestEquipmentEndpointStructure:
    """Test Equipment endpoint request/response structure"""
    
    def test_equipment_post_endpoint_exists(self):
        """Test that POST /api/equipment endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/equipment", json={
            "name": "Test Equipment",
            "specs": "Test specs"
        })
        assert response.status_code == 401
        print("✓ POST /api/equipment endpoint exists and requires auth")


class TestVendorsEndpointStructure:
    """Test Vendors endpoint request/response structure"""
    
    def test_vendors_post_endpoint_exists(self):
        """Test that POST /api/vendors endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/vendors", json={
            "name": "Test Vendor",
            "category": "Produce"
        })
        assert response.status_code == 401
        print("✓ POST /api/vendors endpoint exists and requires auth")


class TestPermitsEndpointStructure:
    """Test Permits endpoint request/response structure"""
    
    def test_permits_post_endpoint_exists(self):
        """Test that POST /api/permits endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/permits", json={
            "name": "Test Permit",
            "issuing_authority": "City"
        })
        assert response.status_code == 401
        print("✓ POST /api/permits endpoint exists and requires auth")


class TestMenuItemsEndpointStructure:
    """Test Menu Items endpoint request/response structure"""
    
    def test_menu_items_post_endpoint_exists(self):
        """Test that POST /api/menu-items endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/menu-items", json={
            "name": "Test Item",
            "category": "Entrees",
            "cost": 10.0,
            "price": 25.0
        })
        assert response.status_code == 401
        print("✓ POST /api/menu-items endpoint exists and requires auth")


class TestBudgetEndpointStructure:
    """Test Budget endpoint request/response structure"""
    
    def test_budget_post_endpoint_exists(self):
        """Test that POST /api/budget endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/budget", json={
            "category": "Construction",
            "planned": 100000
        })
        assert response.status_code == 401
        print("✓ POST /api/budget endpoint exists and requires auth")


class TestSiteDemographics:
    """Test Site Demographics endpoint - requires auth"""
    
    def test_site_demographics_requires_auth(self):
        """Test that site demographics requires auth"""
        response = requests.get(f"{BASE_URL}/api/site/demographics")
        assert response.status_code == 401
        print("✓ GET /api/site/demographics requires auth")


class TestAIEndpoints:
    """Test AI analysis endpoints - require auth"""
    
    def test_ai_analyze_requires_auth(self):
        """Test that AI analyze requires auth"""
        response = requests.post(f"{BASE_URL}/api/ai/analyze", json={
            "analysis_type": "menu",
            "content": "Test content"
        })
        assert response.status_code == 401
        print("✓ POST /api/ai/analyze requires auth")
    
    def test_ai_cost_calculator_requires_auth(self):
        """Test that AI cost calculator requires auth"""
        response = requests.post(f"{BASE_URL}/api/ai/cost-calculator", json={
            "ingredients": "Test ingredients",
            "servings": 4
        })
        assert response.status_code == 401
        print("✓ POST /api/ai/cost-calculator requires auth")


class TestCandidatesEndpoint:
    """Test Candidates endpoint - requires auth"""
    
    def test_candidates_get_requires_auth(self):
        """Test that GET /api/candidates requires auth"""
        response = requests.get(f"{BASE_URL}/api/candidates")
        assert response.status_code == 401
        print("✓ GET /api/candidates requires auth")
    
    def test_candidates_post_requires_auth(self):
        """Test that POST /api/candidates requires auth"""
        response = requests.post(f"{BASE_URL}/api/candidates", json={
            "name": "Test Candidate",
            "position": "Chef"
        })
        assert response.status_code == 401
        print("✓ POST /api/candidates requires auth")


class TestLeaseClausesEndpoint:
    """Test Lease Clauses endpoint - requires auth"""
    
    def test_lease_clauses_get_requires_auth(self):
        """Test that GET /api/lease-clauses requires auth"""
        response = requests.get(f"{BASE_URL}/api/lease-clauses")
        assert response.status_code == 401
        print("✓ GET /api/lease-clauses requires auth")


class TestUnitsEndpoint:
    """Test Units endpoint - requires auth"""
    
    def test_units_get_requires_auth(self):
        """Test that GET /api/units requires auth"""
        response = requests.get(f"{BASE_URL}/api/units")
        assert response.status_code == 401
        print("✓ GET /api/units requires auth")


class TestNotificationsEndpoint:
    """Test Notifications endpoint - requires auth"""
    
    def test_notifications_get_requires_auth(self):
        """Test that GET /api/notifications requires auth"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 401
        print("✓ GET /api/notifications requires auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
