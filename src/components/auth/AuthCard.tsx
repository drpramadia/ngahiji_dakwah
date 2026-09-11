type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function AuthCard({ title, subtitle, children, footer }: Props) {
  return (
    <div className="auth-card">
      <div className="auth-card-head">
        <div className="eyebrow">MY NGAHIJI</div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="auth-card-body">{children}</div>
      {footer && <div className="auth-card-foot">{footer}</div>}
    </div>
  );
}