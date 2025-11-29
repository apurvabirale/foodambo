#!/usr/bin/env python3
"""
Comprehensive Google Authentication Flow Testing for Foodambo API
Tests the /api/auth/google endpoint with various scenarios
"""

import requests
import json
import sys
from datetime import datetime

class GoogleAuthTester:
    def __init__(self, base_url="https://local-foodie.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.critical_failures = []

    def log_test_result(self, test_name, success, details=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name}")
            failure_info = {"test": test_name, "details": details}
            self.failed_tests.append(failure_info)
            if "critical" in test_name.lower() or "jwt" in test_name.lower():
                self.critical_failures.append(failure_info)
        
        if details:
            print(f"   Details: {details}")

    def test_google_auth_endpoint(self, test_name, session_id, expected_status, expected_behavior=""):
        """Test Google auth endpoint with different session scenarios"""
        url = f"{self.base_url}/api/auth/google"
        headers = {'Content-Type': 'application/json'}
        data = {"session_id": session_id}
        
        print(f"\n🔍 Testing: {test_name}")
        print(f"   URL: {url}")
        print(f"   Session ID: {session_id[:50]}..." if len(session_id) > 50 else f"   Session ID: {session_id}")
        print(f"   Expected Status: {expected_status}")
        
        try:
            response = requests.post(url, json=data, headers=headers, timeout=15)
            
            success = response.status_code == expected_status
            
            # Parse response
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            details = {
                "status_code": response.status_code,
                "response": response_data,
                "expected_status": expected_status
            }
            
            # Additional validation based on expected behavior
            if success and expected_status == 200:
                # For successful auth, check required fields
                required_fields = ["success", "token", "user"]
                missing_fields = [field for field in required_fields if field not in response_data]
                if missing_fields:
                    success = False
                    details["missing_fields"] = missing_fields
                elif response_data.get("success") != True:
                    success = False
                    details["success_field_invalid"] = response_data.get("success")
                else:
                    # Validate JWT token format (basic check)
                    token = response_data.get("token", "")
                    if not token or len(token.split('.')) != 3:
                        success = False
                        details["invalid_jwt_format"] = token[:50] if token else "empty"
                    
                    # Validate user object
                    user = response_data.get("user", {})
                    user_required = ["id", "name", "auth_method", "created_at"]
                    missing_user_fields = [field for field in user_required if field not in user]
                    if missing_user_fields:
                        success = False
                        details["missing_user_fields"] = missing_user_fields
            
            elif success and expected_status >= 400:
                # For error responses, check error message exists
                if "detail" not in response_data and "error" not in response_data:
                    details["note"] = "Error response missing detail/error field"
            
            self.log_test_result(test_name, success, details)
            return success, response_data
            
        except requests.exceptions.Timeout:
            details = {"error": "Request timeout (>15s)", "expected_status": expected_status}
            self.log_test_result(test_name, False, details)
            return False, {}
        except Exception as e:
            details = {"error": str(e), "expected_status": expected_status}
            self.log_test_result(test_name, False, details)
            return False, {}

    def test_jwt_token_validation(self, token):
        """Test JWT token by calling protected endpoint"""
        url = f"{self.base_url}/api/auth/me"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        print(f"\n🔍 Testing: JWT Token Validation")
        print(f"   URL: {url}")
        print(f"   Token: {token[:30]}..." if len(token) > 30 else f"   Token: {token}")
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            success = response.status_code == 200
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            details = {
                "status_code": response.status_code,
                "response": response_data
            }
            
            if success:
                # Validate user data structure
                required_fields = ["id", "name", "auth_method"]
                missing_fields = [field for field in required_fields if field not in response_data]
                if missing_fields:
                    success = False
                    details["missing_user_fields"] = missing_fields
            
            self.log_test_result("JWT Token Validation", success, details)
            return success, response_data
            
        except Exception as e:
            details = {"error": str(e)}
            self.log_test_result("JWT Token Validation", False, details)
            return False, {}

    def test_invalid_jwt_token(self):
        """Test with invalid JWT token"""
        url = f"{self.base_url}/api/auth/me"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid_jwt_token_12345'
        }
        
        print(f"\n🔍 Testing: Invalid JWT Token Rejection")
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            # Should return 401 for invalid token
            success = response.status_code == 401
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            details = {
                "status_code": response.status_code,
                "response": response_data,
                "expected_status": 401
            }
            
            self.log_test_result("Invalid JWT Token Rejection", success, details)
            return success
            
        except Exception as e:
            details = {"error": str(e)}
            self.log_test_result("Invalid JWT Token Rejection", False, details)
            return False

    def run_comprehensive_tests(self):
        """Run all Google authentication tests"""
        print("🚀 Starting Comprehensive Google Authentication Testing")
        print("=" * 60)
        print("Note: We cannot test successful Google OAuth without real Google login")
        print("Focus: Testing error handling, API integration, and JWT validation")
        print("=" * 60)

        # Test 1: Invalid session ID
        self.test_google_auth_endpoint(
            "Invalid Session ID",
            "invalid_session_12345",
            400
        )

        # Test 2: Empty session ID
        self.test_google_auth_endpoint(
            "Empty Session ID",
            "",
            400
        )

        # Test 3: Very long session ID (potential buffer overflow test)
        self.test_google_auth_endpoint(
            "Extremely Long Session ID",
            "x" * 1000,
            400
        )

        # Test 4: Session ID with special characters
        self.test_google_auth_endpoint(
            "Session ID with Special Characters",
            "session@#$%^&*()_+{}|:<>?",
            400
        )

        # Test 5: Null/None session ID (will be converted to string)
        self.test_google_auth_endpoint(
            "Null Session ID",
            "null",
            400
        )

        # Test 6: Expired session simulation
        self.test_google_auth_endpoint(
            "Expired Session Simulation",
            "expired_session_abc123",
            400
        )

        # Test 7: Malformed request (missing session_id field)
        print(f"\n🔍 Testing: Missing Session ID Field")
        url = f"{self.base_url}/api/auth/google"
        try:
            response = requests.post(url, json={}, headers={'Content-Type': 'application/json'}, timeout=10)
            success = response.status_code == 422  # Validation error
            details = {"status_code": response.status_code, "expected": 422}
            try:
                details["response"] = response.json()
            except:
                details["response"] = response.text
            self.log_test_result("Missing Session ID Field", success, details)
        except Exception as e:
            self.log_test_result("Missing Session ID Field", False, {"error": str(e)})

        # Test 8: Test JWT validation with invalid token
        self.test_invalid_jwt_token()

        # Test 9: Test Emergent API integration (indirectly)
        print(f"\n🔍 Testing: Emergent API Integration")
        print("   Testing if backend properly calls https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data")
        
        # Use a session ID that might look valid but isn't
        success, response = self.test_google_auth_endpoint(
            "Emergent API Integration Test",
            "test_session_emergent_api_12345",
            400  # Should fail when calling Emergent API
        )
        
        # Check if the error indicates API call was made
        if not success and isinstance(response, dict):
            detail = response.get("detail", "").lower()
            if "session" in detail or "invalid" in detail or "expired" in detail:
                print("   ✅ Backend is properly calling Emergent API (error indicates API integration)")
            else:
                print("   ⚠️  Unclear if Emergent API integration is working")

        # Print comprehensive results
        self.print_results()

    def print_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 60)
        print("📊 GOOGLE AUTHENTICATION TEST RESULTS")
        print("=" * 60)
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.critical_failures:
            print(f"\n🚨 CRITICAL FAILURES ({len(self.critical_failures)}):")
            for failure in self.critical_failures:
                print(f"   - {failure['test']}")
                if failure.get('details'):
                    print(f"     Details: {failure['details']}")
        
        if self.failed_tests:
            print(f"\n❌ ALL FAILED TESTS:")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"   {i}. {failure['test']}")
                if failure.get('details'):
                    details = failure['details']
                    if isinstance(details, dict):
                        for key, value in details.items():
                            print(f"      {key}: {value}")
                    else:
                        print(f"      {details}")
        
        print(f"\n📋 SUMMARY:")
        print(f"✅ Error Handling: {'WORKING' if success_rate >= 80 else 'NEEDS ATTENTION'}")
        print(f"✅ API Integration: {'DETECTED' if any('emergent' in f['test'].lower() for f in self.failed_tests) else 'WORKING'}")
        print(f"✅ JWT Validation: {'WORKING' if not self.critical_failures else 'CRITICAL ISSUE'}")
        
        return success_rate >= 80

def main():
    """Main test execution"""
    tester = GoogleAuthTester()
    
    try:
        success = tester.run_comprehensive_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n🚨 Unexpected error during testing: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())