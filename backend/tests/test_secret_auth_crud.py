"""
Restaurateur Pro API Tests - Iteration 4
Tests for Secret Admin Login (14-day expiry) and full CRUD for Tasks and Team Members
Secret code: restaurateur2026
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session storage
class TestSession:
    session_token = None
    created_task_id = None
    created_member_id = None


class TestSecretAuth:
    """Test secret admin login endpoint"""
    
    def test_secret_login_invalid_code(self):
        """Test POST /api/auth/secret with invalid code returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/secret", json={
            "code": "wrongcode123"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print("✓ POST /api/auth/secret with invalid code returns 401")
    
    def test_secret_login_empty_code(self):
        """Test POST /api/auth/secret with empty code returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/secret", json={
            "code": ""
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/auth/secret with empty code returns 401")
    
    def test_secret_login_valid_code(self):
        """Test POST /api/auth/secret with valid code returns user and sets 14-day session"""
        response = requests.post(f"{BASE_URL}/api/auth/secret", json={
            "code": "restaurateur2026"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify user data returned
        assert "user_id" in data, "Response should contain user_id"
        assert "email" in data, "Response should contain email"
        assert data["email"] == "admin@restaurateurpro.com", f"Expected admin email, got {data['email']}"
        assert "name" in data, "Response should contain name"
        
        # Verify 14-day expiry info
        assert "expires_in_days" in data, "Response should contain expires_in_days"
        assert data["expires_in_days"] == 14, f"Expected 14 days, got {data['expires_in_days']}"
        
        # Store session token from cookies
        if 'session_token' in response.cookies:
            TestSession.session_token = response.cookies['session_token']
        else:
            # Try to get from set-cookie header
            for cookie in response.headers.get('set-cookie', '').split(';'):
                if 'session_token=' in cookie:
                    TestSession.session_token = cookie.split('session_token=')[1].split(';')[0]
                    break
        
        print(f"✓ POST /api/auth/secret with valid code returns user with 14-day session")
        print(f"  - User ID: {data['user_id']}")
        print(f"  - Email: {data['email']}")
        print(f"  - Expires in: {data['expires_in_days']} days")


class TestAuthenticatedAccess:
    """Test authenticated access using secret login session"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Ensure we have a valid session"""
        if not TestSession.session_token:
            response = requests.post(f"{BASE_URL}/api/auth/secret", json={
                "code": "restaurateur2026"
            })
            if response.status_code == 200:
                if 'session_token' in response.cookies:
                    TestSession.session_token = response.cookies['session_token']
    
    def get_auth_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {TestSession.session_token}"}
    
    def test_get_profile_with_auth(self):
        """Test GET /api/profile with valid auth"""
        if not TestSession.session_token:
            pytest.skip("No session token available")
        
        response = requests.get(
            f"{BASE_URL}/api/profile",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "profile_id" in data
        print(f"✓ GET /api/profile with auth returns profile (ID: {data['profile_id']})")
    
    def test_get_auth_me(self):
        """Test GET /api/auth/me with valid auth"""
        if not TestSession.session_token:
            pytest.skip("No session token available")
        
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["email"] == "admin@restaurateurpro.com"
        print(f"✓ GET /api/auth/me returns authenticated user")


class TestTaskCRUD:
    """Test full CRUD operations for Tasks"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Ensure we have a valid session"""
        if not TestSession.session_token:
            response = requests.post(f"{BASE_URL}/api/auth/secret", json={
                "code": "restaurateur2026"
            })
            if response.status_code == 200:
                if 'session_token' in response.cookies:
                    TestSession.session_token = response.cookies['session_token']
    
    def get_auth_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {TestSession.session_token}"}
    
    def test_01_create_task(self):
        """Test POST /api/tasks creates task"""
        if not TestSession.session_token:
            pytest.skip("No session token available")
        
        # First get profile to get profile_id
        profile_response = requests.get(
            f"{BASE_URL}/api/profile",
            headers=self.get_auth_headers()
        )
        profile_id = profile_response.json().get("profile_id", "default")
        
        task_data = {
            "project_id": profile_id,
            "title": "TEST_Task_" + uuid.uuid4().hex[:8],
            "description": "Test task description",
            "status": "pending",
            "priority": "high",
            "due_date": "2026-02-15",
            "category": "general"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tasks",
            json=task_data,
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response data
        assert "task_id" in data, "Response should contain task_id"
        assert data["title"] == task_data["title"], "Title should match"
        assert data["status"] == task_data["status"], "Status should match"
        assert data["priority"] == task_data["priority"], "Priority should match"
        
        TestSession.created_task_id = data["task_id"]
        print(f"✓ POST /api/tasks creates task (ID: {data['task_id']})")
    
    def test_02_get_tasks(self):
        """Test GET /api/tasks returns tasks list"""
        if not TestSession.session_token:
            pytest.skip("No session token available")
        
        response = requests.get(
            f"{BASE_URL}/api/tasks",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/tasks returns {len(data)} tasks")
    
    def test_03_update_task(self):
        """Test PUT /api/tasks/{id} updates task"""
        if not TestSession.session_token or not TestSession.created_task_id:
            pytest.skip("No session token or task ID available")
        
        update_data = {
            "title": "TEST_Updated_Task",
            "status": "active",
            "priority": "medium"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/tasks/{TestSession.created_task_id}",
            json=update_data,
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify update
        assert data["title"] == update_data["title"], "Title should be updated"
        assert data["status"] == update_data["status"], "Status should be updated"
        assert data["priority"] == update_data["priority"], "Priority should be updated"
        print(f"✓ PUT /api/tasks/{TestSession.created_task_id} updates task")
    
    def test_04_verify_task_update_persisted(self):
        """Verify task update was persisted by fetching tasks"""
        if not TestSession.session_token or not TestSession.created_task_id:
            pytest.skip("No session token or task ID available")
        
        response = requests.get(
            f"{BASE_URL}/api/tasks",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        tasks = response.json()
        
        # Find our updated task
        updated_task = next((t for t in tasks if t["task_id"] == TestSession.created_task_id), None)
        assert updated_task is not None, "Updated task should exist"
        assert updated_task["title"] == "TEST_Updated_Task", "Title update should persist"
        assert updated_task["status"] == "active", "Status update should persist"
        print(f"✓ Task update verified - changes persisted in database")
    
    def test_05_delete_task(self):
        """Test DELETE /api/tasks/{id} deletes task"""
        if not TestSession.session_token or not TestSession.created_task_id:
            pytest.skip("No session token or task ID available")
        
        response = requests.delete(
            f"{BASE_URL}/api/tasks/{TestSession.created_task_id}",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("message") == "Deleted", "Should return deleted message"
        print(f"✓ DELETE /api/tasks/{TestSession.created_task_id} deletes task")
    
    def test_06_verify_task_deleted(self):
        """Verify task was deleted by checking it's not in the list"""
        if not TestSession.session_token or not TestSession.created_task_id:
            pytest.skip("No session token or task ID available")
        
        response = requests.get(
            f"{BASE_URL}/api/tasks",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        tasks = response.json()
        
        # Verify task is gone
        deleted_task = next((t for t in tasks if t["task_id"] == TestSession.created_task_id), None)
        assert deleted_task is None, "Deleted task should not exist"
        print(f"✓ Task deletion verified - task no longer in database")


class TestTeamCRUD:
    """Test full CRUD operations for Team Members"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Ensure we have a valid session"""
        if not TestSession.session_token:
            response = requests.post(f"{BASE_URL}/api/auth/secret", json={
                "code": "restaurateur2026"
            })
            if response.status_code == 200:
                if 'session_token' in response.cookies:
                    TestSession.session_token = response.cookies['session_token']
    
    def get_auth_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {TestSession.session_token}"}
    
    def test_01_create_team_member(self):
        """Test POST /api/team creates member"""
        if not TestSession.session_token:
            pytest.skip("No session token available")
        
        member_data = {
            "name": "TEST_John_" + uuid.uuid4().hex[:6],
            "role": "Head Chef",
            "email": "test@example.com",
            "phone": "555-1234",
            "avatar_color": "purple",
            "hire_date": "2026-01-15",
            "notes": "Test team member"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/team",
            json=member_data,
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response data
        assert "member_id" in data, "Response should contain member_id"
        assert data["name"] == member_data["name"], "Name should match"
        assert data["role"] == member_data["role"], "Role should match"
        assert data["email"] == member_data["email"], "Email should match"
        
        TestSession.created_member_id = data["member_id"]
        print(f"✓ POST /api/team creates member (ID: {data['member_id']})")
    
    def test_02_get_team(self):
        """Test GET /api/team returns team list"""
        if not TestSession.session_token:
            pytest.skip("No session token available")
        
        response = requests.get(
            f"{BASE_URL}/api/team",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/team returns {len(data)} members")
    
    def test_03_update_team_member(self):
        """Test PUT /api/team/{id} updates member"""
        if not TestSession.session_token or not TestSession.created_member_id:
            pytest.skip("No session token or member ID available")
        
        update_data = {
            "name": "TEST_Updated_John",
            "role": "Executive Chef",
            "email": "updated@example.com"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/team/{TestSession.created_member_id}",
            json=update_data,
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify update
        assert data["name"] == update_data["name"], "Name should be updated"
        assert data["role"] == update_data["role"], "Role should be updated"
        assert data["email"] == update_data["email"], "Email should be updated"
        print(f"✓ PUT /api/team/{TestSession.created_member_id} updates member")
    
    def test_04_verify_member_update_persisted(self):
        """Verify member update was persisted by fetching team"""
        if not TestSession.session_token or not TestSession.created_member_id:
            pytest.skip("No session token or member ID available")
        
        response = requests.get(
            f"{BASE_URL}/api/team",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        team = response.json()
        
        # Find our updated member
        updated_member = next((m for m in team if m["member_id"] == TestSession.created_member_id), None)
        assert updated_member is not None, "Updated member should exist"
        assert updated_member["name"] == "TEST_Updated_John", "Name update should persist"
        assert updated_member["role"] == "Executive Chef", "Role update should persist"
        print(f"✓ Member update verified - changes persisted in database")
    
    def test_05_delete_team_member(self):
        """Test DELETE /api/team/{id} deletes member"""
        if not TestSession.session_token or not TestSession.created_member_id:
            pytest.skip("No session token or member ID available")
        
        response = requests.delete(
            f"{BASE_URL}/api/team/{TestSession.created_member_id}",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("message") == "Deleted", "Should return deleted message"
        print(f"✓ DELETE /api/team/{TestSession.created_member_id} deletes member")
    
    def test_06_verify_member_deleted(self):
        """Verify member was deleted by checking it's not in the list"""
        if not TestSession.session_token or not TestSession.created_member_id:
            pytest.skip("No session token or member ID available")
        
        response = requests.get(
            f"{BASE_URL}/api/team",
            headers=self.get_auth_headers()
        )
        assert response.status_code == 200
        team = response.json()
        
        # Verify member is gone
        deleted_member = next((m for m in team if m["member_id"] == TestSession.created_member_id), None)
        assert deleted_member is None, "Deleted member should not exist"
        print(f"✓ Member deletion verified - member no longer in database")


class TestLogout:
    """Test logout functionality"""
    
    def test_logout(self):
        """Test POST /api/auth/logout"""
        if not TestSession.session_token:
            pytest.skip("No session token available")
        
        response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {TestSession.session_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("message") == "Logged out"
        print("✓ POST /api/auth/logout works correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
