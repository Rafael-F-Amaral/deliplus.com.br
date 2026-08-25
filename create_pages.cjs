const fs = require('fs');
const pages = ['production', 'menu', 'customers', 'marketing', 'finance', 'reports', 'team', 'settings'];

pages.forEach(p => {
  const d = 'app/dashboard/' + p;
  if (!fs.existsSync(d)) fs.mkdirSync(d, {recursive: true});
  fs.writeFileSync(d + '/page.tsx', `export default function Page() { return <div className="flex h-full items-center justify-center p-20"><h1 className="text-3xl text-gray-400 font-medium">Em construção</h1></div>; }`);
});
