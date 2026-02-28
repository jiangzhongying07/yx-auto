// Cloudflare Worker - 甜爸专属提速引擎版
// 核心：多源并发提速、物理锁死 subapi.20082020.xyz、强制挂载不良林规则

// ========================
// 核心配置区 (绝对锁死)
// ========================
const SUB_BACKEND = 'https://subapi.20082020.xyz/sub';
const BULIANGLIN_RULE = 'https://raw.githubusercontent.com/bulianglin/demo/main/nodnsleak.ini';

// 极速静态优选域名池
const directDomains = [
    { name: "CF-极速1", domain: "cloudflare.182682.xyz" },
    { name: "CF-极速2", domain: "bestcf.top" },
    { name: "CF-极速3", domain: "cdn.2020111.xyz" },
    { name: "CF-极速4", domain: "cf.090227.xyz" }
];

// ========================
// 超能力1：并发极速拉取动态 IP
// ========================
async function fetchWetestIPs() {
    const urls = [
        "https://www.wetest.vip/page/cloudflare/address_v4.html",
        "https://www.wetest.vip/page/cloudflare/address_v6.html"
    ];
    
    try {
        const responses = await Promise.all(
            urls.map(url => fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.ok ? r.text() : ''))
        );
        
        let ips = [];
        responses.forEach(html => {
            if (!html) return;
            const rows = html.match(/<tr[\s\S]*?<\/tr>/g) || [];
            rows.forEach(row => {
                const m = row.match(/<td data-label="线路名称">(.+?)<\/td>[\s\S]*?<td data-label="优选地址">([\d.:a-fA-F]+)<\/td>/);
                if (m) ips.push({ isp: m[1].replace(/<.*?>/g, '').trim(), ip: m[2].trim() });
            });
        });
        return ips;
    } catch (e) {
        return [];
    }
}

// 节点构建引擎
function buildNodes(list, uuid, host, path) {
    return list.map(item => {
        const safeIp = item.ip.includes(':') ? `[${item.ip}]` : item.ip;
        const remark = encodeURIComponent(item.isp || '提速节点');
        return `vless://${uuid}@${safeIp}:443?encryption=none&security=tls&sni=${host}&fp=chrome&type=ws&host=${host}&path=${encodeURIComponent(path)}#${remark}`;
    });
}

// ========================
// 超能力2：物理隔离的高性能前端 UI
// ========================
function renderUI() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>甜爸极速订阅中心</title>
    <style>
        :root { --main: #007aff; --bg: #f5f5f7; --card: #ffffff; }
        body { font-family: -apple-system, sans-serif; background: var(--bg); padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 90vh; margin: 0; }
        .engine-card { background: var(--card); width: 100%; max-width: 480px; padding: 30px; border-radius: 24px; box-shadow: 0 12px 40px rgba(0,0,0,0.08); }
        h2 { text-align: center; color: #1d1d1f; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 25px; }
        .input-group { margin-bottom: 20px; }
        label { display: block; font-size: 13px; font-weight: 600; color: #86868b; margin-bottom: 8px; text-transform: uppercase; }
        input { width: 100%; padding: 14px 16px; font-size: 16px; border: 2px solid transparent; background: #f2f2f7; border-radius: 14px; box-sizing: border-box; transition: all 0.2s; outline: none; }
        input:focus { border-color: var(--main); background: #fff; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 30px; }
        button { padding: 16px; border: none; border-radius: 14px; font-size: 15px; font-weight: 600; color: #fff; cursor: pointer; transition: transform 0.1s; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        button:active { transform: scale(0.96); }
        .btn-clash { background: linear-gradient(135deg, #007aff, #0051d5); }
        .btn-sb { background: linear-gradient(135deg, #5856d6, #4341aa); }
        .btn-surge { background: linear-gradient(135deg, #34c759, #28a745); }
        .btn-v2 { background: linear-gradient(135deg, #ff9500, #d37b00); }
        .console { margin-top: 25px; padding: 16px; background: #e8f0fe; border-radius: 12px; font-size: 13px; color: #1967d2; word-break: break-all; display: none; border: 1px dashed #1967d2; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="engine-card">
        <h2>⚡ 提速订阅引擎</h2>
        <div class="input-group">
            <label>边缘域名 (Domain)</label>
            <input type="text" id="domain" value="20082020.xyz">
        </div>
        <div class="input-group">
            <label>身份凭证 (UUID)</label>
            <input type="text" id="uuid" placeholder="粘贴你的 UUID">
        </div>
        <div class="input-group">
            <label>伪装路径 (Path)</label>
            <input type="text" id="path" value="/">
        </div>
        
        <div class="grid">
            <button class="btn-clash" onclick="generate('clash')">生成 CLASH</button>
            <button class="btn-sb" onclick="generate('sing-box')">生成 SING-BOX</button>
            <button class="btn-surge" onclick="generate('surge')">生成 SURGE</button>
            <button class="btn-v2" onclick="generate('v2ray')">获取源节点</button>
        </div>
        
        <div id="console" class="console"></div>
    </div>

    <script>
        function generate(client) {
            const dom = document.getElementById('domain').value.trim();
            const uid = document.getElementById('uuid').value.trim();
            const pth = document.getElementById('path').value.trim();
            
            if(!uid) {
                alert('⚠️ 必须填写 UUID 才能生成节点！');
                return;
            }

            // 超能力3：硬编码拦截，拒绝一切外部变量污染
            const BACKEND = "https://subapi.20082020.xyz/sub";
            const RULE = encodeURIComponent("https://raw.githubusercontent.com/bulianglin/demo/main/nodnsleak.ini");
            
            // 拼接源订阅地址
            const sourceUrl = window.location.origin + "/" + uid + "/sub?domain=" + dom + "&path=" + encodeURIComponent(pth);
            
            let resultUrl = "";
            if(client === 'v2ray') {
                resultUrl = sourceUrl;
            } else {
                // 完美组装：后端 + 目标客户端 + 源节点 + 不良林规则
                resultUrl = BACKEND + "?target=" + client + "&url=" + encodeURIComponent(sourceUrl) + "&config=" + RULE + "&insert=false&emoji=true&list=false&xudp=false&udp=false&tfo=false&expand=true&scv=false&fdn=false&new_name=true";
            }

            const con = document.getElementById('console');
            con.textContent = resultUrl;
            con.style.display = 'block';

            navigator.clipboard.writeText(resultUrl).then(() => {
                alert('✅ ' + client.toUpperCase() + ' 极速订阅已就绪！\\n\\n1. 后端已锁定: 20082020.xyz\\n2. 规则已挂载: 不良林防泄露');
            }).catch(err => {
                alert('复制失败，请手动长按下方链接复制');
            });
        }
    </script>
</body>
</html>`;
}

// ========================
// 路由控制器
// ========================
export default {
    async fetch(request) {
        const url = new URL(request.url);
        
        // 渲染 UI 界面
        if (url.pathname === '/' || url.pathname === '') {
            return new Response(renderUI(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        // 处理后端转换器的拉取请求
        const subMatch = url.pathname.match(/^\/([^\/]+)\/sub$/);
        if (subMatch) {
            const uuid = subMatch[1];
            const domain = url.searchParams.get('domain') || '20082020.xyz';
            const path = url.searchParams.get('path') || '/';
            
            const nodes = [];
            // 加入原生域名节点
            nodes.push(...buildNodes([{ ip: url.hostname, isp: '专属直连' }], uuid, domain, path));
            // 加入静态极速节点
            nodes.push(...buildNodes(directDomains.map(d => ({ ip: d.domain, isp: d.name })), uuid, domain, path));
            // 加入动态拉取的优选节点
            const dynamicIps = await fetchWetestIPs();
            if(dynamicIps.length > 0) {
                nodes.push(...buildNodes(dynamicIps, uuid, domain, path));
            }
            
            return new Response(btoa(nodes.join('\n')), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }

        return new Response('404 Not Found - 路由不存在', { status: 404 });
    }
};
