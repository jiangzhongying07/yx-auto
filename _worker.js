// Cloudflare Worker - 甜爸定制版优选工具
// 核心修复：强制使用私有后端 subapi.20082020.xyz
// 核心功能：集成不良林 nodnsleak.ini 防 DNS 泄漏规则

// --- 基础配置 ---
const MY_BACKEND = 'https://subapi.20082020.xyz/sub'; 
const BULIANGLIN_CONFIG = 'https://raw.githubusercontent.com/bulianglin/demo/main/nodnsleak.ini';
const DEFAULT_IP_URL = 'https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt';

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

// --- 工具函数 ---
async function fetchDynamicIPs(v4 = true, v6 = true, mb = true, uc = true, tc = true) {
    let results = [];
    try {
        const fetchWetest = async (url) => {
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (!res.ok) return [];
            const html = await res.text();
            const rows = html.match(/<tr[\s\S]*?<\/tr>/g) || [];
            return rows.map(row => {
                const m = row.match(/<td data-label="线路名称">(.+?)<\/td>[\s\S]*?<td data-label="优选地址">([\d.:a-fA-F]+)<\/td>[\s\S]*?<td data-label="数据中心">(.+?)<\/td>/);
                return m ? { isp: m[1].replace(/<.*?>/g, '').trim(), ip: m[2].trim(), colo: m[3].replace(/<.*?>/g, '').trim() } : null;
            }).filter(i => i);
        };
        if (v4) results.push(...await fetchWetest("https://www.wetest.vip/page/cloudflare/address_v4.html"));
        if (v6) results.push(...await fetchWetest("https://www.wetest.vip/page/cloudflare/address_v6.html"));
        return results.filter(i => (i.isp.includes('移动') && mb) || (i.isp.includes('联通') && uc) || (i.isp.includes('电信') && tc));
    } catch (e) { return []; }
}

// --- 节点生成 ---
function generateVless(list, user, host, path) {
    return list.map(item => {
        const name = `${item.isp || 'CF'}-${item.colo || ''}-443-TLS`;
        const params = new URLSearchParams({ encryption: 'none', security: 'tls', sni: host, fp: 'chrome', type: 'ws', host: host, path: path });
        const ip = item.ip.includes(':') ? `[${item.ip}]` : item.ip;
        return `vless://${user}@${ip}:443?${params.toString()}#${encodeURIComponent(name)}`;
    });
}

// --- 主逻辑 ---
async function handleSub(request, uuid, domain, path) {
    const url = new URL(request.url);
    const nodes = [];
    nodes.push(...generateVless([{ ip: url.hostname, isp: '源站' }], uuid, domain, path));
    nodes.push(...generateVless(directDomains.map(d => ({ ip: d.domain, isp: d.name || d.domain })), uuid, domain, path));
    const ips = await fetchDynamicIPs();
    nodes.push(...generateVless(ips, uuid, domain, path));
    
    return new Response(btoa(nodes.join('\n')), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

// --- 页面 HTML ---
function getHtml() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>甜爸的优选工具</title>
    <style>
        body { font-family: -apple-system, sans-serif; background: #f2f2f7; color: #1c1c1e; padding: 20px; line-height: 1.6; }
        .card { max-width: 500px; margin: 20px auto; background: white; padding: 25px; border-radius: 20px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
        h2 { text-align: center; color: #007aff; margin-bottom: 30px; }
        .group { margin-bottom: 20px; }
        label { display: block; font-size: 13px; font-weight: 600; color: #8e8e93; margin-bottom: 8px; text-transform: uppercase; }
        input { width: 100%; padding: 12px; border: 1px solid #d1d1d6; border-radius: 12px; box-sizing: border-box; font-size: 16px; background: #f9f9f9; }
        .btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 25px; }
        button { padding: 14px; border: none; border-radius: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 15px; }
        .btn-blue { background: #007aff; color: white; }
        .btn-blue:active { background: #0056b3; transform: scale(0.98); }
        .btn-purple { background: #5856d6; color: white; }
        #result { margin-top: 25px; padding: 15px; background: #f2f2f7; border-radius: 12px; font-size: 12px; word-break: break-all; color: #007aff; display: none; border: 1px dashed #007aff; }
    </style>
</head>
<body>
    <div class="card">
        <h2>🚀 优选订阅生成</h2>
        <div class="group"><label>部署域名</label><input type="text" id="domain" placeholder="例如: 20082010.xyz"></div>
        <div class="group"><label>UUID / 密码</label><input type="text" id="uuid" placeholder="填入你的UUID"></div>
        <div class="group"><label>WS 路径</label><input type="text" id="path" value="/"></div>
        
        <div class="btn-grid">
            <button class="btn-blue" onclick="makeLink('clash', 'CLASH')">CLASH 订阅</button>
            <button class="btn-purple" onclick="makeLink('sing-box', 'SING-BOX')">SING-BOX 订阅</button>
            <button class="btn-blue" style="background:#34c759" onclick="makeLink('surge', 'SURGE')">SURGE 订阅</button>
            <button class="btn-purple" style="background:#ff9500" onclick="makeLink('v2ray', '通用格式')">BASE64 链接</button>
        </div>
        <div id="result"></div>
    </div>

    <script>
        function makeLink(target, name) {
            const domain = document.getElementById('domain').value.trim();
            const uuid = document.getElementById('uuid').value.trim();
            const path = document.getElementById('path').value.trim();
            if(!domain || !uuid) return alert('请填写完整信息');

            // 强制指向甜爸的后端
            const backend = "https://subapi.20082020.xyz/sub";
            const config = encodeURIComponent("${BULIANGLIN_CONFIG}");
            const subUrl = window.location.origin + "/" + uuid + "/sub?domain=" + domain + "&path=" + encodeURIComponent(path);
            
            let finalUrl = "";
            if(target === 'v2ray') {
                finalUrl = subUrl; // Base64 直接用原链接
            } else {
                finalUrl = backend + "?target=" + target + "&url=" + encodeURIComponent(subUrl) + "&config=" + config + "&insert=false&emoji=true&list=false&xudp=false&udp=false&tfo=false&expand=true&scv=false&fdn=false&new_name=true";
            }

            const resBox = document.getElementById('result');
            resBox.textContent = finalUrl;
            resBox.style.display = 'block';
            
            navigator.clipboard.writeText(finalUrl).then(() => {
                alert(name + " 订阅已复制！\\n已集成不良林防泄露规则");
            });
        }
    </script>
</body>
</html>`;
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        if (path === '/' || path === '') {
            return new Response(getHtml(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        const subMatch = path.match(/^\/([^\/]+)\/sub$/);
        if (subMatch) {
            const uuid = subMatch[1];
            const domain = url.searchParams.get('domain');
            const wsPath = url.searchParams.get('path') || '/';
            return await handleSub(request, uuid, domain, wsPath);
        }

        return new Response('Not Found', { status: 404 });
    }
};
