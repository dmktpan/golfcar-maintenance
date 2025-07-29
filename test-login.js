// ทดสอบการ Login
const testLogin = async () => {
  const baseURL = 'http://localhost:3000';
  
  console.log('Testing login API...');
  
  // ทดสอบ admin login
  const adminLoginData = {
    identifier: 'admin000',
    password: '123456',
    loginType: 'admin'
  };
  
  console.log('Testing admin login:', adminLoginData);
  
  try {
    const response = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminLoginData),
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok && data.success) {
      console.log('✅ Admin login successful!');
      console.log('User data:', data.user);
      console.log('Token:', data.token ? 'Present' : 'Missing');
    } else {
      console.log('❌ Admin login failed:', data.message);
    }
  } catch (error) {
    console.error('Error testing login:', error);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // ทดสอบ staff login (ถ้ามี staff user)
  const staffLoginData = {
    identifier: 'TEST001',
    loginType: 'staff'
  };
  
  console.log('Testing staff login:', staffLoginData);
  
  try {
    const response = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(staffLoginData),
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok && data.success) {
      console.log('✅ Staff login successful!');
      console.log('User data:', data.user);
    } else {
      console.log('❌ Staff login failed:', data.message);
    }
  } catch (error) {
    console.error('Error testing staff login:', error);
  }
};

testLogin();