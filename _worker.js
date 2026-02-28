// Cloudflare Worker - 甜爸专用终极版
// 1. 强行锁定后端：https://subapi.20082020.xyz/sub
// 2. 强行锁定规则：不良林 nodnsleak.ini
// 3. 彻底删除所有旧版默认值和冗余开关

export default {
    async fetch(request) {
        const url = new URL(request.url);
        const path = url.pathname;

        // --- 核心配置区 ---
        const MY_BACKEND = "https://subapi.20082020.xyz/sub";
        const BULIANGLIN_RULE = "https://raw.githubusercontent.com/bulianglin/demo/main/nodnsleak.ini";

        // 处理订阅内容请求 (由后端转换器调用)
        if (path.endsWith('/sub')) {
            const uuidMatch = path.match(/^\/(.+)\/sub$/);
            const uuid = uuidMatch ? uuidMatch[1] : 'uuid-error';
            const domain = url.searchParams.get('domain') || '20082020.xyz';
            const wsPath = url.searchParams.get('path') || '/';

            // 生成节点信息 (Base64)
            const nodeInfo = `vless://${uuid}@${url.hostname}:443?encryption=none&security=tls&sni=${domain}&fp=chrome&type=ws&host=${domain}&path=${encodeURIComponent(wsPath)}#甜爸专用节点`;
            return new Response(btoa(nodeInfo), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }

        // 返回精简版前端页面
        const html = `<!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>订阅工具-甜爸定制</title>
            <style>
                body { font-family: -apple-system, sans-serif; background: #f4f4f9; padding: 20px; display: flex; justify-content: center; }
                .card { background: white; padding: 25px; border-radius: 18px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
                h3 { text-align: center; color: #333; margin-bottom: 20px; }
                label { font-size: 13px; color: #666; font-weight: bold; }
                input { width: 100%; padding: 12px; margin: 8px 0 18px; border: 1px solid #ddd; border-radius: 10px; box-sizing: border-box; }
                button { width: 100%; padding: 14px; margin: 6px 0; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; color: white; transition: 0.2s; }
                .clash { background: #007aff; }
                .sb { background: #5856d6; }
                .surge { background: #34c759; }
                #result { margin-top: 20px; padding: 12px; background: #f0f0f5; border-radius: 10px; word-break: break-all; font-size: 11px; display: none; color: #007aff; border: 1px solid #007aff; }
            </style>
        </head>
        <body>
            <div class="card">
                <h3>🚀 订阅生成 (不良林规则版)</h3>
                <label>部署域名</label>
                <input type="text" id="domain" value="20082020.xyz">
                <label>UUID / 密码</label>
                <input type="text" id="uuid" placeholder="粘贴你的UUID">
                <label>WS 路径</label>
                <input type="text" id="path" value="/">
                
                <button class="clash" onclick="build('clash')">复制 CLASH 订阅</button>
                <button class="sb" onclick="build('sing-box')">复制 SING-BOX 订阅</button>
                <button class="surge" onclick="build('surge')">复制 SURGE 订阅</button>
                
                <div id="result"></div>
            </div>

            <script>
                function build(target) {
                    const dom = document.getElementById('domain').value.trim();
                    const uuid = document.getElementById('uuid').value.trim();
                    const pth = document.getElementById('path').value.trim();
                    
                    if(!uuid) return alert('请先输入UUID');

                    // 1. 锁定后端地址
                    const api = "${MY_BACKEND}";
                    // 2. 锁定规则地址 (关键：必须使用 config 参数)
                    const config = encodeURIComponent("${BULIANGLIN_RULE}");
                    // 3. 构造原始订阅源
                    const source = window.location.origin + "/" + uuid + "/sub?domain=" + dom + "&path=" + encodeURIComponent(pth);
                    
                    // 4. 拼接最终链接 (加入不良林规则 &config=)
                    const final = api + "?target=" + target + "&url=" + encodeURIComponent(source) + "&config=" + config + "&insert=false&emoji=true&list=false&xudp=false&udp=false&tfo=false&expand=true&scv=false&fdn=false&new_name=true";
                    
                    const resBox = document.getElementById('result');
                    resBox.textContent = final;
                    resBox.style.display = 'block';
                    
                    navigator.clipboard.writeText(final).then(() => {
                        alert('已复制 ' + target.toUpperCase() + ' 订阅链接\\n后端及规则已生效！');
                    });
                }
            </script>
        </body>
        </html>`;

        return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
};
