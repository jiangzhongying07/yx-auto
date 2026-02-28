// Cloudflare Worker - 甜爸专用优选工具 (彻底修复版)
// 强制后端: https://subapi.20082020.xyz/sub
// 强制规则: 不良林 nodnsleak.ini

// --- 基础写死配置，绝不回退 ---
const MY_API = 'https://subapi.20082020.xyz/sub';
const REMOTE_CONFIG = 'https://raw.githubusercontent.com/bulianglin/demo/main/nodnsleak.ini';

// 默认优选域名
const directDomains = [
    { name: "cloudflare.182682.xyz", domain: "cloudflare.182682.xyz" },
    { domain: "freeyx.cloudflare88.eu.org" },
    { domain: "bestcf.top" },
    { domain: "cdn.2020111.xyz" },
    { domain: "cf.0sm.com" },
    { domain: "cf.090227.xyz" },
    { domain: "cf.zhetengsha.eu.org" },
    { domain: "cfip.1323123.xyz" },
    { domain: "cloudflare-ip.mofashi.ltd" },
    { domain: "cf.877771.xyz" },
    { domain: "xn--b6gac.eu.org" }
];

// --- 核心逻辑 ---
async function fetchWetestIPs() {
    try {
        const v4 = await fetch("https://www.wetest.vip/page/cloudflare/address_v4.html", { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
        const rows = v4.match(/<tr[\s\S]*?<\/tr>/g) || [];
        return rows.map(row => {
            const m = row.match(/<td data-label="线路名称">(.+?)<\/td>[\s\S]*?<td data-label="优选地址">([\d.:a-fA-F]+)<\/td>/);
            return m ? { isp: m[1].replace(/<.*?>/g, '').trim(), ip: m[2].trim() } : null;
        }).filter(i => i);
    } catch (e) { return []; }
}

function buildVless(list, user, host, path) {
    return list.map(item => {
        const ip = item.ip.includes(':') ? `[${item.ip}]` : item.ip;
        return `vless://${user}@${ip}:443?encryption=none&security=tls&sni=${host}&fp=chrome&type=ws&host=${host}&path=${encodeURIComponent(path)}#${encodeURIComponent(item.isp || 'CF')}`;
    });
}

// --- 界面渲染 ---
function renderUI() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>服务器优选工具</title>
    <style>
        body { font-family: -apple-system, sans-serif; background: #f2f2f7; padding: 20px; }
        .card { max-width: 500px; margin: auto; background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .group { margin-bottom: 15px; }
        label { display: block; font-size: 12px; color: #8e8e93; margin-bottom: 5px; font-weight: bold; }
        input { width: 100%; padding: 12px; border: 1px solid #d1d1d6; border-radius: 10px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
        button { padding: 15px; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; color: white; background: #007aff; }
        #link-box { margin-top: 20px; padding: 15px; background: #e5e5ea; border-radius: 10px; word-break: break-all; font-size: 12px; display: none; color: #007aff; border: 1px solid #007aff; }
    </style>
</head>
<body>
    <div class="card">
        <h2 style="text-align:center; color:#1c1c1e;">🚀 甜爸专用优选</h2>
        <div class="group"><label>你的域名</label><input type="text" id="dom" value="20082020.xyz"></div>
        <div class="group"><label>UUID</label><input type="text" id="uid" placeholder="在此粘贴UUID"></div>
        <div class="group"><label>WS 路径</label><input type="text" id="pth" value="/"></div>
        
        <div class="grid">
            <button onclick="gen('clash', 'CLASH')">CLASH</button>
            <button style="background:#5856d6" onclick="gen('sing-box', 'SING-BOX')">SING-BOX</button>
            <button style="background:#34c759" onclick="gen('surge', 'SURGE')">SURGE</button>
            <button style="background:#ff9500" onclick="gen('v2ray', '通用格式')">通用格式</button>
        </div>
        <div id="link-box"></div>
    </div>

    <script>
        function gen(target, label) {
            const dom = document.getElementById('dom').value.trim();
            const uid = document.getElementById('uid').value.trim();
            const pth = document.getElementById('pth').value.trim();
            if(!dom || !uid) return alert('必填项不能为空');

            const mySub = window.location.origin + "/" + uid + "/sub?domain=" + dom + "&path=" + encodeURIComponent(pth);
            let final = "";
            
            if(target === 'v2ray') {
                final = mySub;
            } else {
                // 彻底锁定后端地址，绝对不再出现 url.v1.mk
                const api = "https://subapi.20082020.xyz/sub";
                const cfg = encodeURIComponent("${REMOTE_CONFIG}");
                final = \`\${api}?target=\${target}&url=\${encodeURIComponent(mySub)}&config=\${cfg}&insert=false&emoji=true&list=false&xudp=false&udp=false&tfo=false&expand=true&scv=false&fdn=false&new_name=true\`;
            }

            const box = document.getElementById('link-box');
            box.textContent = final;
            box.style.display = 'block';
            
            navigator.clipboard.writeText(final).then(() => {
                alert(label + " 订阅已复制到剪贴板！\\n后端已切换为私有接口");
            });
        }
    </script>
</body>
</html>`;
}

// --- 处理逻辑 ---
export default {
    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/' || url.pathname === '') {
            return new Response(renderUI(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        const match = url.pathname.match(/^\/([^\/]+)\/sub$/);
        if (match) {
            const uuid = match[1];
            const domain = url.searchParams.get('domain');
            const path = url.searchParams.get('path') || '/';
            const ips = await fetchWetestIPs();
            const nodes = [];
            nodes.push(...buildVless([{ ip: url.hostname, isp: '源站节点' }], uuid, domain, path));
            nodes.push(...buildVless(directDomains.map(d => ({ ip: d.domain, isp: d.name || d.domain })), uuid, domain, path));
            nodes.push(...buildVless(ips, uuid, domain, path));
            return new Response(btoa(nodes.join('\n')), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }
        return new Response('Not Found', { status: 404 });
    }
};
