const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIP();
console.log('\n========================================');
console.log('ダイエットダッシュボード起動情報');
console.log('========================================');
console.log(`ローカルアクセス: http://localhost:3000`);
console.log(`iPhoneからアクセス: http://${ip}:3000`);
console.log(`API エンドポイント: http://${ip}:3000/api/health`);
console.log('========================================');
console.log('iPhoneショートカットの設定方法:');
console.log('shortcut-setup-guide.md を参照してください');
console.log('========================================\n');