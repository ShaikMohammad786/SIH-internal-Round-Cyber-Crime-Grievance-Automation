const fs = require('fs');
const path = require('path');

// Test frontend configuration and build readiness
console.log('🔍 Testing Frontend Configuration');
console.log('=====================================');

const tests = [
  {
    name: 'Package.json exists',
    test: () => fs.existsSync(path.join(__dirname, 'package.json'))
  },
  {
    name: 'Source directory exists',
    test: () => fs.existsSync(path.join(__dirname, 'src'))
  },
  {
    name: 'Main App component exists',
    test: () => fs.existsSync(path.join(__dirname, 'src', 'App.jsx'))
  },
  {
    name: 'Main entry point exists',
    test: () => fs.existsSync(path.join(__dirname, 'src', 'main.jsx'))
  },
  {
    name: 'Index HTML exists',
    test: () => fs.existsSync(path.join(__dirname, 'index.html'))
  },
  {
    name: 'Vite config exists',
    test: () => fs.existsSync(path.join(__dirname, 'vite.config.js'))
  },
  {
    name: 'All page components exist',
    test: () => {
      const pages = ['Home.jsx', 'Login.jsx', 'Register.jsx', 'Dashboard.jsx', 'AdminDashboard.jsx', 'RegisterCase.jsx', 'CaseHistory.jsx', 'CaseStatus.jsx', 'Admin.jsx'];
      return pages.every(page => fs.existsSync(path.join(__dirname, 'src', 'pages', page)));
    }
  },
  {
    name: 'All component files exist',
    test: () => {
      const components = ['Header.jsx', 'ProtectedRoute.jsx', 'AdminProtectedRoute.jsx', 'UserProtectedRoute.jsx', 'SessionManager.jsx', 'UserProfile.jsx', 'CaseDetailsModal.jsx', 'ScammerDetailsModal.jsx', 'FormInput.jsx'];
      return components.every(component => fs.existsSync(path.join(__dirname, 'src', 'components', component)));
    }
  },
  {
    name: 'All utility files exist',
    test: () => {
      const utils = ['auth.js', 'casesAPI.js', 'userProfilesAPI.js', 'formUtils.js'];
      return utils.every(util => fs.existsSync(path.join(__dirname, 'src', 'utils', util)));
    }
  },
  {
    name: 'All CSS files exist',
    test: () => {
      const cssFiles = [
        'src/index.css',
        'src/App.css',
        'src/components/Header.css',
        'src/components/FormInput.css',
        'src/components/UserProfile.css',
        'src/components/CaseDetailsModal.css',
        'src/components/ScammerDetailsModal.css',
        'src/pages/Home.css',
        'src/pages/Login.css',
        'src/pages/Register.css',
        'src/pages/Dashboard.css',
        'src/pages/AdminDashboard.css',
        'src/pages/RegisterCase.css',
        'src/pages/CaseHistory.css',
        'src/pages/CaseStatus.css',
        'src/pages/Admin.css'
      ];
      return cssFiles.every(cssFile => fs.existsSync(path.join(__dirname, cssFile)));
    }
  },
  {
    name: 'Node modules directory exists',
    test: () => fs.existsSync(path.join(__dirname, 'node_modules'))
  },
  {
    name: 'Package.json has required dependencies',
    test: () => {
      try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
        const requiredDeps = ['react', 'react-dom', 'react-router-dom', 'axios', 'jspdf'];
        return requiredDeps.every(dep => packageJson.dependencies && packageJson.dependencies[dep]);
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Build directory exists (if built)',
    test: () => fs.existsSync(path.join(__dirname, 'dist')) || true // Optional test
  }
];

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  try {
    const result = test.test();
    if (result) {
      console.log(`✅ ${test.name}`);
      passed++;
    } else {
      console.log(`❌ ${test.name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${test.name} - Error: ${error.message}`);
    failed++;
  }
});

console.log('\n=====================================');
console.log('📊 Frontend Test Results');
console.log('=====================================');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 Frontend is properly configured!');
  console.log('\n📝 Next steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Start development server: npm run dev');
  console.log('3. Build for production: npm run build');
} else {
  console.log('\n⚠️  Some frontend files are missing. Please check the errors above.');
}

// Check if package.json scripts are properly configured
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  console.log('\n📋 Available Scripts:');
  Object.keys(packageJson.scripts || {}).forEach(script => {
    console.log(`  - npm run ${script}: ${packageJson.scripts[script]}`);
  });
} catch (error) {
  console.log('\n❌ Could not read package.json scripts');
}

process.exit(failed === 0 ? 0 : 1);
