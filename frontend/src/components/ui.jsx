export function MaterialIcon({ name, filled = false, className = '' }) {
  return <span aria-hidden="true" className={`material-symbols-rounded ${className}`} style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}>{name}</span>;
}

export function Button({ variant = 'primary', icon, loading = false, children, className = '', ...props }) {
  return <button className={`button button--${variant} ${className}`} {...props}>
    {loading ? <span className="button-spinner" aria-hidden="true" /> : icon && <MaterialIcon name={icon} />}
    <span>{children}</span>
  </button>;
}

export function IconButton({ icon, label, className = '', ...props }) {
  return <button className={`icon-button ${className}`} aria-label={label} title={label} {...props}><MaterialIcon name={icon} /></button>;
}

export function Card({ children, className = '' }) { return <section className={`card ${className}`}>{children}</section>; }

const badgeLabels = { ok: 'Correcta', parcial: 'Parcial', error: 'Error', activo: 'Activo', inactivo: 'Inactivo', disponible: 'Disponible', pendiente: 'Pendiente', leida: 'Leída', mejor: 'Mejor precio' };
export function StatusBadge({ status, children }) {
  const normalized = String(status ?? '').toLowerCase();
  return <span className={`badge badge--${normalized}`}><span className="badge__dot" />{children ?? badgeLabels[normalized] ?? status}</span>;
}

export function EmptyState({ icon = 'inbox', title, description, action }) {
  return <div className="empty-state"><MaterialIcon name={icon} /><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function ErrorState({ message, retry }) {
  return <div className="error-state" role="alert"><MaterialIcon name="error" /><div><strong>No fue posible cargar esta información.</strong><p>{message}</p></div>{retry && <Button variant="outline" icon="refresh" onClick={retry}>Reintentar</Button>}</div>;
}

export function Skeleton({ lines = 3 }) {
  return <div className="skeleton" aria-label="Cargando" aria-busy="true">{Array.from({ length: lines }, (_, index) => <span key={index} />)}</div>;
}

export function TableWrap({ children }) { return <div className="table-wrap">{children}</div>; }
