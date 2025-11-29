import requests
import sys
import json
from datetime import datetime

class FoodamboAPITester:
    def __init__(self, base_url="https://foodambo-market.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.store_id = None
        self.product_id = None
        self.order_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=data)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_send_otp(self, phone):
        """Test sending OTP"""
        success, response = self.run_test(
            "Send OTP",
            "POST",
            "auth/send-otp",
            200,
            data={"phone": phone}
        )
        return success

    def test_verify_otp(self, phone, code):
        """Test OTP verification and get token"""
        success, response = self.run_test(
            "Verify OTP",
            "POST",
            "auth/verify-otp",
            200,
            data={"phone": phone, "code": code}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('user', {}).get('id')
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_get_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_store(self):
        """Test creating a store"""
        success, response = self.run_test(
            "Create Store",
            "POST",
            "stores",
            200,
            data={
                "store_name": "Test Store",
                "address": "123 Test Street, Test City",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "categories": ["fresh_food", "pickles"]
            }
        )
        if success and 'id' in response:
            self.store_id = response['id']
            print(f"   Store created: {self.store_id}")
            return True
        return False

    def test_get_my_store(self):
        """Test getting my store"""
        success, response = self.run_test(
            "Get My Store",
            "GET",
            "stores/me",
            200
        )
        return success

    def test_create_product(self):
        """Test creating a product"""
        success, response = self.run_test(
            "Create Product",
            "POST",
            "products",
            200,
            data={
                "category": "fresh_food",
                "title": "Test Biryani",
                "description": "Delicious homemade biryani",
                "price": 150.0,
                "photos": [],
                "product_type": "fresh_food",
                "details": {},
                "availability_days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
                "availability_times": {"start": "09:00", "end": "21:00"},
                "min_quantity": 1,
                "delivery_available": True,
                "pickup_available": True
            }
        )
        if success and 'id' in response:
            self.product_id = response['id']
            print(f"   Product created: {self.product_id}")
            return True
        return False

    def test_get_products(self):
        """Test getting all products"""
        success, response = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200,
            data={
                "latitude": 28.6139,
                "longitude": 77.2090,
                "radius_km": 2.0
            }
        )
        return success

    def test_get_product_detail(self):
        """Test getting product by ID"""
        if not self.product_id:
            print("❌ Skipping product detail test - no product ID")
            return False
        
        success, response = self.run_test(
            "Get Product Detail",
            "GET",
            f"products/{self.product_id}",
            200
        )
        return success

    def test_create_order(self):
        """Test creating an order"""
        if not self.product_id:
            print("❌ Skipping order test - no product ID")
            return False
            
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data={
                "product_id": self.product_id,
                "quantity": 2,
                "delivery_method": "pickup",
                "scheduled_date": "2025-01-15",
                "scheduled_time": "18:00"
            }
        )
        if success and 'id' in response:
            self.order_id = response['id']
            print(f"   Order created: {self.order_id}")
            return True
        return False

    def test_get_my_orders(self):
        """Test getting my orders"""
        success, response = self.run_test(
            "Get My Orders",
            "GET",
            "orders/my",
            200
        )
        return success

    def test_google_auth_invalid(self):
        """Test Google auth with invalid session (should fail)"""
        success, response = self.run_test(
            "Google Auth (Invalid)",
            "POST",
            "auth/google",
            400,  # Should fail with invalid session
            data={"session_id": "invalid_session_123"}
        )
        return success  # Success means it properly rejected invalid session

def main():
    print("🚀 Starting Foodambo API Testing...")
    print("=" * 50)
    
    # Setup
    tester = FoodamboAPITester()
    test_phone = "+919876543210"
    test_otp = "123456"

    # Authentication Flow
    print("\n📱 Testing Authentication Flow...")
    if not tester.test_send_otp(test_phone):
        print("❌ Send OTP failed, but continuing with mocked OTP...")
    
    if not tester.test_verify_otp(test_phone, test_otp):
        print("❌ OTP verification failed, stopping tests")
        return 1

    if not tester.test_get_me():
        print("❌ Get current user failed")
        return 1

    # Store Management
    print("\n🏪 Testing Store Management...")
    if not tester.test_create_store():
        print("❌ Store creation failed, stopping tests")
        return 1
    
    if not tester.test_get_my_store():
        print("❌ Get my store failed")

    # Product Management
    print("\n📦 Testing Product Management...")
    if not tester.test_create_product():
        print("❌ Product creation failed")
    
    if not tester.test_get_products():
        print("❌ Get products failed")
    
    if not tester.test_get_product_detail():
        print("❌ Get product detail failed")

    # Order Management
    print("\n🛒 Testing Order Management...")
    if not tester.test_create_order():
        print("❌ Order creation failed")
    
    if not tester.test_get_my_orders():
        print("❌ Get my orders failed")

    # Additional Auth Tests
    print("\n🔐 Testing Additional Auth...")
    tester.test_google_auth_invalid()

    # Print Results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure.get('test', 'Unknown')}: {failure}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())