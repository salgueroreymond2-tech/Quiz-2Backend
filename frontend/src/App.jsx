import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, EmptyState, ErrorState, IconButton, MaterialIcon, Skeleton, StatusBadge, TableWrap } from './components/ui.jsx';

const currency = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 2 });
const dateFormatter = new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Costa_Rica' });
const navItems = [
  ['dashboard', 'dashboard', 'Dashboard'], ['productos', 'inventory_2', 'Productos'], ['comparador', 'compare_arrows', 'Comparador'],
  ['proveedores', 'domain', 'Proveedores'], ['historial', 'history', 'Historial'], ['capturas', 'sync', 'Capturas'],
  ['alertas', 'notifications', 'Alertas'], ['configuracion', 'settings', 'Configuración']
];
const pageTitles = Object.fromEntries(navItems.map(([id, _icon, label]) => [id, label]));
const parseUtc = (value) => value ? new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${String(value).replace(' ', 'T')}Z`) : null;
const money = (value) => value === null || value === undefined ? '—' : currency.format(Number(value));
const date = (value) => { const parsed = parseUtc(value); return parsed && !Number.isNaN(parsed) ? dateFormatter.format(parsed) : 'Sin fecha'; };
const isActive = (value) => value === true || value === 1 || value === '1';

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.mensaje ?? 'La solicitud no pudo completarse.');
  return body;
}

function KpiCard({ icon, label, value, detail, accent = 'navy' }) {
  return <Card className={`kpi-card kpi-card--${accent}`}><div className="kpi-card__top"><span>{label}</span><MaterialIcon name={icon} /></div><strong>{value}</strong><small>{detail}</small></Card>;
}

function PriceRange({ prices }) {
  if (prices.length < 2) return null;
  const values = prices.map((item) => Number(item.precio_unitario_normalizado));
  const min = Math.min(...values); const max = Math.max(...values); const spread = max - min;
  return <div className="price-range"><div className="price-range__labels"><span>Rango de precios</span><strong>{money(spread)}</strong></div><div className="price-range__track">{prices.map((item) => <span key={item.proveedor_codigo} title={`${item.proveedor}: ${money(item.precio_unitario_normalizado)}`} className="price-range__marker" style={{ left: `${max === min ? 0 : ((Number(item.precio_unitario_normalizado) - min) / (max - min)) * 100}%` }} />)}</div><div className="price-range__labels"><small>{money(min)}</small><small>{money(max)}</small></div></div>;
}

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('delvalle-theme') ?? 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [health, setHealth] = useState(null);
  const [products, setProducts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [configuration, setConfiguration] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [history, setHistory] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [banner, setBanner] = useState(null);
  const [initialError, setInitialError] = useState('');

  const setNotice = (type, message) => setBanner({ type, message });
  const loadInitial = useCallback(async () => {
    setInitialLoading(true); setInitialError('');
    const results = await Promise.allSettled([
      api('/health'), api('/api/productos?limit=100'), api('/api/proveedores'), api('/api/alertas?limit=50'),
      api('/api/capturas/ejecuciones?limit=20'), api('/api/configuracion')
    ]);
    const value = (index) => results[index].status === 'fulfilled' ? results[index].value : null;
    const productData = value(1)?.data ?? [];
    setHealth(value(0)); setProducts(productData); setProviders(value(2)?.data ?? []); setAlerts(value(3)?.data ?? []);
    setExecutions(value(4)?.data ?? []); setConfiguration(value(5)?.data ?? []);
    setSelectedId((current) => productData.some((item) => item.id === current) ? current : productData[0]?.id ?? null);
    const failed = results.find((item) => item.status === 'rejected');
    if (failed) setNotice('error', 'Algunos datos no están disponibles. Verifique que la API y MySQL estén activos.');
    if (results[0].status === 'rejected' && results[1].status === 'rejected') setInitialError('No fue posible comunicarse con la API. Compruebe que el servidor y MySQL estén en ejecución.');
    setInitialLoading(false);
  }, []);

  const loadComparison = useCallback(async (productId) => {
    if (!productId) { setComparison(null); return; }
    setComparisonLoading(true);
    try { setComparison(await api(`/api/productos/${productId}/precios`)); }
    catch (error) { setComparison(null); setNotice('error', error.message); }
    finally { setComparisonLoading(false); }
  }, []);

  const loadHistory = useCallback(async (productId) => {
    if (!productId) return;
    setHistoryLoading(true);
    try { const response = await api(`/api/productos/${productId}/historial`); setHistory(response.capturas ?? []); }
    catch (error) { setHistory([]); setNotice('error', error.message); }
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);
  useEffect(() => { loadComparison(selectedId); }, [selectedId, loadComparison]);
  useEffect(() => { if (page === 'historial') loadHistory(selectedId); }, [page, selectedId, loadHistory]);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('delvalle-theme', theme); }, [theme]);

  const selectedProduct = products.find((item) => item.id === selectedId) ?? null;
  const filteredProducts = useMemo(() => products.filter((item) => `${item.nombre} ${item.codigo_interno}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const unreadAlerts = alerts.filter((item) => !isActive(item.leida));
  const threshold = configuration.find((item) => item.clave === 'umbral_alerta_pct')?.valor ?? '5';

  const navigate = (next) => { setPage(next); setDrawerOpen(false); };
  const runCapture = async () => {
    setCaptureLoading(true); setBanner(null);
    try {
      const response = await api('/api/capturas/ejecutar', { method: 'POST', body: '{}' });
      setNotice(response.estado === 'ok' ? 'success' : 'warning', `Captura ${response.estado}: ${response.total_alertas} alerta(s) generada(s).`);
      await loadInitial(); await loadComparison(selectedId);
    } catch (error) { setNotice('error', error.message); } finally { setCaptureLoading(false); }
  };
  const updateThreshold = async (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const umbral = Number(form.get('umbral_pct'));
    try { await api('/api/configuracion/umbral-alerta', { method: 'PUT', body: JSON.stringify({ umbral_pct: umbral }) }); setNotice('success', 'El umbral de alertas fue actualizado.'); await loadInitial(); }
    catch (error) { setNotice('error', error.message); }
  };
  const markRead = async (id) => {
    try { await api(`/api/alertas/${id}/leida`, { method: 'PATCH' }); setAlerts((current) => current.map((item) => item.id === id ? { ...item, leida: true } : item)); }
    catch (error) { setNotice('error', error.message); }
  };

  const Sidebar = () => <aside className={`sidebar ${sidebarCollapsed ? 'sidebar--collapsed' : ''} ${drawerOpen ? 'sidebar--open' : ''}`} aria-label="Navegación principal">
    <div className="brand"><div className="brand__mark"><span /><span /><span /></div><div className="brand__copy"><strong>Del Valle</strong><small>Price Intelligence</small></div></div>
    <nav>{navItems.map(([id, icon, label]) => <button key={id} className={`nav-item ${page === id ? 'nav-item--active' : ''}`} onClick={() => navigate(id)} data-tooltip={label} aria-current={page === id ? 'page' : undefined}><MaterialIcon name={icon} filled={page === id} /><span>{label}</span>{id === 'alertas' && unreadAlerts.length > 0 && <b>{unreadAlerts.length}</b>}</button>)}</nav>
    <div className="sidebar__footer"><button className="nav-item sidebar-collapse" onClick={() => setSidebarCollapsed((current) => !current)} data-tooltip={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}><MaterialIcon name={sidebarCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'} /><span>{sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}</span></button><button className="nav-item" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} data-tooltip={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}><MaterialIcon name={theme === 'light' ? 'dark_mode' : 'light_mode'} /><span>{theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</span></button><p><span className="live-dot" /> API {health?.estado === 'ok' ? 'conectada' : 'sin conexión'}</p></div>
  </aside>;

  const Header = () => <header className="topbar"><div className="topbar__title"><IconButton className="menu-toggle" icon="menu" label="Abrir navegación" onClick={() => setDrawerOpen(true)} /><div><p className="breadcrumbs">Del Valle <span>/</span> {pageTitles[page]}</p><h1>{pageTitles[page]}</h1></div></div><div className="topbar__actions"><label className="search"><MaterialIcon name="search" /><input aria-label="Buscar productos" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar productos" /></label><button className="notification-button" aria-label={`${unreadAlerts.length} alertas sin leer`} onClick={() => navigate('alertas')}><MaterialIcon name="notifications" filled={unreadAlerts.length > 0} />{unreadAlerts.length > 0 && <span>{unreadAlerts.length}</span>}</button><IconButton icon={theme === 'light' ? 'dark_mode' : 'light_mode'} label="Cambiar tema" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} /></div></header>;

  const ComparisonTable = () => {
    if (comparisonLoading) return <Skeleton lines={5} />;
    if (!comparison?.precios?.length) return <EmptyState icon="compare_arrows" title="No hay precios disponibles" description="Ejecute una captura para comparar proveedores de este producto." action={<Button variant="outline" icon="sync" onClick={runCapture} disabled={captureLoading}>Ejecutar captura</Button>} />;
    return <><PriceRange prices={comparison.precios} /><TableWrap><table><thead><tr><th>Proveedor</th><th className="align-right">Precio normalizado</th><th className="align-right">Diferencia</th><th>Estado</th><th>Actualización</th></tr></thead><tbody>{comparison.precios.map((item, index) => <tr key={item.proveedor_codigo} className={index === 0 ? 'best-row' : ''}><td><strong>{item.proveedor}</strong><small>{item.sku}</small></td><td className="align-right price">{money(item.precio_unitario_normalizado)}</td><td className="align-right">{index === 0 ? '—' : `+ ${money(item.diferencia_crc)}`}</td><td>{index === 0 ? <StatusBadge status="mejor" /> : <StatusBadge status="disponible" />}</td><td>{date(item.capturado_en)}</td></tr>)}</tbody></table></TableWrap></>;
  };

  const Dashboard = () => <div className="page-stack">{initialLoading ? <Skeleton lines={5} /> : <><section className="kpi-grid"><KpiCard icon="inventory_2" label="Productos registrados" value={products.length} detail={`${products.filter((item) => isActive(item.activo)).length} activos en catálogo`} /><KpiCard icon="domain" label="Proveedores activos" value={providers.filter((item) => isActive(item.activo)).length} detail="Fuentes configuradas" accent="slate" /><KpiCard icon="notifications" label="Alertas pendientes" value={unreadAlerts.length} detail="Cambios de precio sin revisar" accent="amber" /><KpiCard icon="sync" label="Última captura" value={executions[0]?.estado ? <StatusBadge status={executions[0].estado} /> : '—'} detail={executions[0] ? date(executions[0].iniciada_en) : 'Sin ejecuciones registradas'} accent="info" /></section><section className="dashboard-grid"><Card className="best-price-card"><div className="section-heading"><div><p className="section-kicker">MEJOR PRECIO ACTUAL</p><h2>{comparison?.producto?.nombre ?? 'Sin producto seleccionado'}</h2></div><StatusBadge status="mejor" /></div>{comparison?.mejor_precio ? <><strong className="best-price-card__value">{money(comparison.mejor_precio.precio)}</strong><p><MaterialIcon name="domain" /> {comparison.mejor_precio.proveedor}</p><small>Actualizado {date(comparison.mejor_precio.capturado_en)}</small></> : <EmptyState icon="price_check" title="Sin comparación vigente" description="Seleccione un producto o ejecute una captura." />}</Card><Card className="activity-card"><div className="section-heading"><div><p className="section-kicker">OPERACIÓN</p><h2>Captura de precios</h2></div><MaterialIcon name="sync" /></div><p>Actualice las fuentes simuladas y registre el histórico sin sobrescribir capturas anteriores.</p><Button icon="sync" loading={captureLoading} disabled={captureLoading} onClick={runCapture}>{captureLoading ? 'Ejecutando captura…' : 'Ejecutar captura'}</Button></Card></section><Card><div className="section-heading"><div><p className="section-kicker">VISTA RÁPIDA</p><h2>Comparación de proveedores</h2></div><Button variant="ghost" icon="arrow_forward" onClick={() => navigate('comparador')}>Ver comparador</Button></div><ComparisonTable /></Card></>}</div>;

  const Products = () => <div className="page-stack"><Card><div className="section-heading"><div><p className="section-kicker">CATÁLOGO CENTRAL</p><h2>Productos</h2><p className="muted">Use el buscador del encabezado para filtrar por nombre o código interno.</p></div><span className="count-label">{filteredProducts.length} resultados</span></div>{initialLoading ? <Skeleton lines={6} /> : filteredProducts.length ? <TableWrap><table><thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Unidad</th><th>Estado</th><th aria-label="Acciones" /></tr></thead><tbody>{filteredProducts.map((item) => <tr key={item.id}><td className="code">{item.codigo_interno}</td><td><strong>{item.nombre}</strong><small>{item.descripcion || 'Sin descripción adicional'}</small></td><td>{item.categoria_nombre ?? 'Sin categoría'}</td><td>{item.unidad}</td><td><StatusBadge status={isActive(item.activo) ? 'activo' : 'inactivo'} /></td><td className="actions"><IconButton icon="compare_arrows" label={`Comparar ${item.nombre}`} onClick={() => { setSelectedId(item.id); navigate('comparador'); }} /></td></tr>)}</tbody></table></TableWrap> : <EmptyState icon="inventory_2" title="No se encontraron productos" description="Pruebe con otro término de búsqueda." />}</Card></div>;

  const Comparator = () => <div className="page-stack"><Card className="comparator-intro"><div><p className="section-kicker">INTELIGENCIA DE PRECIOS</p><h2>Comparador de proveedores</h2><p className="muted">Los importes se normalizan según la unidad definida para cada equivalencia.</p></div><label className="field"><span>Producto a comparar</span><select value={selectedId ?? ''} onChange={(event) => setSelectedId(Number(event.target.value))}>{products.map((item) => <option key={item.id} value={item.id}>{item.codigo_interno} — {item.nombre}</option>)}</select></label></Card><Card>{comparison?.producto && <div className="section-heading"><div><p className="section-kicker">{comparison.producto.codigo_interno}</p><h2>{comparison.producto.nombre}</h2><p className="muted">Unidad interna: {comparison.producto.unidad}</p></div>{comparison.mejor_precio && <div className="comparison-highlight"><small>Mejor opción</small><strong>{money(comparison.mejor_precio.precio)}</strong><span>{comparison.mejor_precio.proveedor}</span></div>}</div>}<ComparisonTable /></Card></div>;

  const Providers = () => <div className="page-stack"><Card><div className="section-heading"><div><p className="section-kicker">FUENTES DE INFORMACIÓN</p><h2>Proveedores</h2><p className="muted">Configuración de las fuentes de captura del prototipo.</p></div></div>{providers.length ? <TableWrap><table><thead><tr><th>Proveedor</th><th>Código</th><th>Tipo de fuente</th><th>Ruta configurada</th><th>Estado</th></tr></thead><tbody>{providers.map((provider) => <tr key={provider.id}><td><strong>{provider.nombre}</strong></td><td className="code">{provider.codigo}</td><td><StatusBadge status="pendiente">{provider.tipo_fuente.toUpperCase()}</StatusBadge></td><td className="muted">{provider.ruta_fuente}</td><td><StatusBadge status={isActive(provider.activo) ? 'activo' : 'inactivo'} /></td></tr>)}</tbody></table></TableWrap> : <EmptyState icon="domain" title="No hay proveedores registrados" description="Las fuentes configuradas aparecerán aquí." />}</Card></div>;

  const History = () => <div className="page-stack"><Card><div className="section-heading"><div><p className="section-kicker">TRAZABILIDAD</p><h2>Historial de capturas</h2></div><label className="field field--compact"><span>Producto</span><select value={selectedId ?? ''} onChange={(event) => setSelectedId(Number(event.target.value))}>{products.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label></div>{historyLoading ? <Skeleton lines={6} /> : history.length ? <TableWrap><table><thead><tr><th>Fecha de captura</th><th>Proveedor</th><th>SKU</th><th className="align-right">Precio</th><th className="align-right">Normalizado</th><th>Disponibilidad</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td>{date(item.capturado_en)}</td><td><strong>{item.proveedor_nombre}</strong></td><td className="code">{item.sku_proveedor}</td><td className="align-right price">{money(item.precio)}</td><td className="align-right">{money(item.precio_unitario_normalizado)}</td><td><StatusBadge status={isActive(item.disponible) ? 'disponible' : 'inactivo'} /></td></tr>)}</tbody></table></TableWrap> : <EmptyState icon="history" title="Sin capturas para este producto" description="Al ejecutar una captura, cada resultado quedará registrado aquí." />}</Card></div>;

  const Captures = () => <div className="page-stack"><Card className="capture-panel"><div><p className="section-kicker">PROCESO MANUAL</p><h2>Ejecutar captura</h2><p className="muted">Consulta cada fuente activa, guarda nuevas capturas y continúa si una fuente falla.</p></div><Button icon="sync" loading={captureLoading} disabled={captureLoading} onClick={runCapture}>{captureLoading ? 'Ejecutando captura…' : 'Ejecutar ahora'}</Button></Card><Card><div className="section-heading"><div><p className="section-kicker">AUDITORÍA</p><h2>Ejecuciones recientes</h2></div></div>{executions.length ? <TableWrap><table><thead><tr><th>Inicio</th><th>Proveedor</th><th>Estado</th><th className="align-right">Leídos</th><th className="align-right">Guardados</th><th>Mensaje</th></tr></thead><tbody>{executions.map((item) => <tr key={item.id}><td>{date(item.iniciada_en)}</td><td><strong>{item.proveedor_nombre}</strong><small>{item.proveedor_codigo}</small></td><td><StatusBadge status={item.estado} /></td><td className="align-right">{item.leidos}</td><td className="align-right">{item.guardados}</td><td className="muted">{item.mensaje || '—'}</td></tr>)}</tbody></table></TableWrap> : <EmptyState icon="sync" title="Aún no hay ejecuciones" description="La actividad de captura aparecerá cuando se ejecute el proceso." />}</Card></div>;

  const Alerts = () => <div className="page-stack"><Card><div className="section-heading"><div><p className="section-kicker">VARIACIONES DE PRECIO</p><h2>Alertas</h2><p className="muted">Cambios que alcanzaron el umbral configurado.</p></div><span className="count-label">{unreadAlerts.length} pendientes</span></div>{alerts.length ? <TableWrap><table><thead><tr><th>Producto</th><th>Proveedor</th><th>Variación</th><th className="align-right">Precio anterior</th><th className="align-right">Nuevo precio</th><th>Estado</th><th aria-label="Acción" /></tr></thead><tbody>{alerts.map((item) => <tr key={item.id}><td><strong>{item.producto_nombre}</strong><small>{item.codigo_interno}</small></td><td>{item.proveedor_nombre}</td><td><span className={item.direccion === 'alza' ? 'trend trend--up' : 'trend trend--down'}><MaterialIcon name={item.direccion === 'alza' ? 'trending_up' : 'trending_down'} />{Number(item.variacion_pct).toFixed(2)}%</span></td><td className="align-right">{money(item.precio_anterior)}</td><td className="align-right price">{money(item.precio_nuevo)}</td><td><StatusBadge status={isActive(item.leida) ? 'leida' : 'pendiente'} /></td><td className="actions">{!isActive(item.leida) && <IconButton icon="done" label="Marcar como leída" onClick={() => markRead(item.id)} />}</td></tr>)}</tbody></table></TableWrap> : <EmptyState icon="notifications_off" title="No hay alertas registradas" description="Los cambios importantes de precio aparecerán aquí." />}</Card></div>;

  const Settings = () => <div className="settings-grid"><Card><p className="section-kicker">REGLAS DE ALERTAS</p><h2>Umbral de variación</h2><p className="muted">Una alerta se crea cuando el cambio absoluto de precio alcanza este porcentaje.</p><form className="settings-form" onSubmit={updateThreshold}><label className="field"><span>Porcentaje de alerta</span><div className="input-with-suffix"><input name="umbral_pct" type="number" min="0.01" max="100" step="0.01" defaultValue={threshold} required /><span>%</span></div><small>Valor permitido entre 0.01 y 100.</small></label><Button icon="save">Guardar configuración</Button></form></Card><Card><p className="section-kicker">SISTEMA</p><h2>Estado de servicios</h2><dl className="status-list"><div><dt>API</dt><dd><StatusBadge status={health?.estado === 'ok' ? 'activo' : 'error'}>{health?.estado === 'ok' ? 'Conectada' : 'Sin conexión'}</StatusBadge></dd></div><div><dt>Base de datos</dt><dd>MySQL</dd></div><div><dt>Modo de fuentes</dt><dd>Simulado</dd></div><div><dt>Zona horaria</dt><dd>America/Costa_Rica</dd></div></dl></Card></div>;

  const renderPage = () => initialError ? <ErrorState message={initialError} retry={loadInitial} /> : ({ dashboard: <Dashboard />, productos: <Products />, comparador: <Comparator />, proveedores: <Providers />, historial: <History />, capturas: <Captures />, alertas: <Alerts />, configuracion: <Settings /> }[page]);

  return <div className="app-shell" data-theme={theme}><Sidebar />{drawerOpen && <button className="drawer-backdrop" aria-label="Cerrar navegación" onClick={() => setDrawerOpen(false)} />}<div className="app-main"><Header />{banner && <div className={`notice notice--${banner.type}`} role="status"><MaterialIcon name={banner.type === 'error' ? 'error' : banner.type === 'warning' ? 'warning' : 'check_circle'} /><span>{banner.message}</span><IconButton icon="close" label="Cerrar mensaje" onClick={() => setBanner(null)} /></div>}<main className="content">{renderPage()}</main><footer><div><strong>Del Valle Price Intelligence</strong><span>Sistema de comparación de precios y proveedores</span></div><span>Proyecto académico · Node.js · React · MySQL</span></footer></div></div>;
}
