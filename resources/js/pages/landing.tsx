import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import ChatWidget from '@/components/chat/chat-widget';
import AppearanceToggle from '@/components/appearance-toggle';
import {
    Menu,
    X,
    Globe,
    Mail,
    ShoppingCart,
    Code2,
    Sparkles,
    LifeBuoy,
    Check,
    ChevronDown,
    Server,
    Bot,
    HelpCircle,
    ArrowRight,
} from 'lucide-react';

const plans = [
    {
        name: 'VPS Compartido',
        price: 5,
        description: 'Ideal para empezar tu primer proyecto web.',
        highlight: false,
        features: [
            '1 dominio',
            '1 correo',
            '2 GB de RAM',
            '2 CPU',
            '40 GB SSD',
        ],
    },
    {
        name: 'VPS Completo',
        price: 10,
        description: 'Para sitios en crecimiento con tráfico moderado.',
        highlight: true,
        features: [
            'Dominios ilimitados',
            'Correos ilimitados',
            '4 CPU',
            '6 GB de RAM',
            '150 GB SSD',
        ],
    },
    {
        name: 'VPS Premium',
        price: 20,
        description: 'Rendimiento máximo para proyectos exigentes.',
        highlight: false,
        features: [
            'Dominios ilimitados',
            'Correos ilimitados',
            '6 CPU',
            '8 GB de RAM',
            '400 GB SSD',
        ],
    },
];

const features = [
    {
        icon: Globe,
        title: 'Dominio gratis',
        description: 'Registra tu dominio sin costo adicional el primer año.',
    },
    {
        icon: Mail,
        title: 'Correos ilimitados',
        description: 'Crea cuentas profesionales con tu propio dominio.',
    },
    {
        icon: ShoppingCart,
        title: 'WordPress y WooCommerce',
        description: 'Instalación optimizada en un click para tu tienda online.',
    },
    {
        icon: Code2,
        title: 'Software a medida',
        description: 'Desarrollo personalizado para llevar tu idea a producción.',
    },
    {
        icon: Sparkles,
        title: 'Agentes de IA',
        description: 'Automatiza soporte, ventas y contenido con inteligencia artificial.',
    },
    {
        icon: LifeBuoy,
        title: 'Soporte técnico',
        description: 'Equipo humano disponible para ayudarte cuando lo necesites.',
    },
];

const faqs = [
    {
        question: '¿Quiénes somos?',
        answer: 'HostBol es un proveedor de hosting con sede en Bolivia, enfocado en ofrecer servidores VPS rápidos, seguros y con soporte humano real. Atendemos clientes en toda Latinoamérica.',
    },
    {
        question: '¿Qué métodos de pago aceptan?',
        answer: 'Aceptamos pagos por QR (transferencias bancarias locales, Tigo Money, Yape, etc.) y PayPal. Para clientes empresariales también facturamos a 30 días.',
    },
    {
        question: '¿Cómo funciona el soporte técnico?',
        answer: 'Nuestro equipo está disponible a través de tickets por email y chat en vivo. Para planes VPS Completo y Premium, también brindamos soporte por WhatsApp en horario extendido.',
    },
    {
        question: '¿Ofrecen software a medida?',
        answer: 'Sí. Desarrollamos software personalizado, landing pages, sistemas web, e-commerce y aplicaciones a medida con Laravel, Node.js o WordPress. Pedimos una reunión inicial sin compromiso.',
    },
];

const agents = [
    {
        name: 'OpenClaw',
        subtitle: 'Gateway multi-canal',
        description:
            'Conecta WhatsApp, Telegram, Discord, Slack y más con agentes de IA desde un solo Gateway self-hosted.',
        bullets: ['13+ canales integrados', 'Multi-agente con sesiones aisladas', 'Open source MIT'],
        logo: '/storage/7/openclaw-square.png',
        url: 'https://docs.openclaw.ai/',
    },
    {
        name: 'Hermes',
        subtitle: 'Agente con memoria persistente',
        description:
            'De Nous Research. Recuerda tus proyectos, crea habilidades automáticamente y opera en múltiples plataformas.',
        bullets: ['Memoria persistente entre sesiones', '40+ habilidades integradas', 'Telegram, Discord, WhatsApp'],
        logo: '/storage/8/hermes-square.png',
        url: 'https://hermes-agent.org/es/',
    },
    {
        name: 'OpenCode',
        subtitle: 'Agente de codificación',
        description:
            'Asistente IA open source para terminal, IDE o escritorio. Compatible con Claude, GPT, Gemini y modelos locales.',
        bullets: ['7.5M+ desarrolladores', '75+ proveedores de LLM', '100% open source'],
        logo: '/storage/9/opencode-square.png',
        url: 'https://opencode.ai/es',
    },
    {
        name: 'Odysseus',
        subtitle: 'Workspace IA self-hosted',
        description:
            'Suite completa con chat, agentes, documentos, email, notas y calendario. Todo en tu propio servidor.',
        bullets: ['Chat + agentes + documentos', 'Email, notas y calendario', 'Modelos locales o API'],
        logo: '/storage/10/odysseus-square.jpg',
        url: 'https://github.com/pewdiepie-archdaemon/odysseus',
    },
];

const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-xl border border-border bg-card">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-accent"
            >
                <span className="text-base font-medium text-foreground">{question}</span>
                <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition ${
                        open ? 'rotate-180 text-primary' : ''
                    }`}
                />
            </button>
            {open && (
                <div className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
                    {answer}
                </div>
            )}
        </div>
    );
};

export default function Landing() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { props } = usePage<{
        site?: {
            title?: string;
            icon_url?: string | null;
            logo_url?: string | null;
        };
        chatSettings?: {
            chat_enabled: boolean;
            position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
            welcome_message: string;
            offline_message: string;
            online: boolean;
        };
    }>();
    const site = props.site;
    const siteTitle = site?.title ?? 'HostBol';
    const iconUrl = site?.icon_url ?? null;
    const logoUrl = site?.logo_url ?? null;
    const chatSettings = props.chatSettings;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
                    <a href="/" className="flex shrink-0 items-center gap-2.5 text-xl font-bold">
                        {iconUrl ? (
                            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-muted shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/30">
                                <img
                                    src={iconUrl}
                                    alt={siteTitle}
                                    className="h-full w-full object-contain"
                                />
                            </span>
                        ) : (
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-base font-extrabold text-white shadow-lg shadow-indigo-500/30">
                                {siteTitle.charAt(0).toUpperCase()}
                            </span>
                        )}
                        <span className="text-foreground">{siteTitle}</span>
                    </a>

                    <div className="hidden flex-1 items-center justify-end gap-1 md:flex">
                        <a
                            href="#caracteristicas"
                            className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                        >
                            <Server className="h-4 w-4" />
                            Características
                        </a>
                        <a
                            href="#planes"
                            className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                        >
                            <Globe className="h-4 w-4" />
                            Planes
                        </a>
                        <a
                            href="#agentes"
                            className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                        >
                            <Bot className="h-4 w-4" />
                            Agentes
                        </a>
                        <a
                            href="#faq"
                            className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                        >
                            <HelpCircle className="h-4 w-4" />
                            FAQ
                        </a>
                    </div>

                    <div className="flex items-center gap-2">
                        <AppearanceToggle className="hidden md:inline-flex" />
                        <button
                            type="button"
                            onClick={() => setMobileOpen((v) => !v)}
                            className="grid h-10 w-10 place-items-center rounded-md border border-border hover:bg-accent md:hidden"
                            aria-label="Menú"
                        >
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </nav>

            {mobileOpen && (
                <div className="fixed inset-0 z-[60] md:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-l border-border bg-background shadow-2xl shadow-black/50">
                        <div className="flex items-center justify-between border-b border-border px-5 py-4">
                            <span className="text-sm font-semibold text-foreground">Menú</span>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent"
                                aria-label="Cerrar menú"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-1 p-4">
                            <a href="#caracteristicas" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"><Server className="h-4 w-4" />Características</a>
                            <a href="#planes" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"><Globe className="h-4 w-4" />Planes</a>
                            <a href="#agentes" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"><Bot className="h-4 w-4" />Agentes</a>
                            <a href="#faq" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"><HelpCircle className="h-4 w-4" />FAQ</a>
                        </div>
                        <div className="mt-auto flex items-center gap-2 border-t border-border p-4">
                            <span className="text-xs text-muted-foreground">Tema</span>
                            <AppearanceToggle />
                        </div>
                    </div>
                </div>
            )}

            <section
                id="inicio"
                className="relative isolate flex min-h-[80vh] w-full items-center justify-center overflow-hidden px-4 py-14 sm:px-6 sm:py-16 md:min-h-[85vh] md:py-20"
                style={{
                    backgroundImage: 'url(/storage/3/hero_H1qZdRpx_1.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div
                    className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/85 via-slate-900/80 to-slate-950/90 dark:from-slate-950/90 dark:via-slate-950/85 dark:to-slate-950/95"
                />
                <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/25 blur-3xl" />
                <div className="pointer-events-none absolute top-1/2 right-0 -z-10 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-cyan-500/15 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 left-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-indigo-400/10 blur-3xl" />

                <div className="relative mx-auto w-full max-w-5xl text-center text-white">
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 shadow-lg shadow-indigo-500/10">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        Uptime 99.9% garantizado
                    </div>

                    <h1 className="mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-7xl">
                        Hosting rápido y seguro
                        <br />
                        <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">
                            para tu próximo proyecto
                        </span>
                    </h1>

                    <p className="mx-auto mb-10 max-w-2xl text-base text-slate-200 sm:text-lg md:text-xl">
                        SSD NVMe, soporte 24/7 y migración gratuita.
                        Lanza tu sitio en minutos con nuestra plataforma optimizada.
                    </p>

                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <a
                            href="#planes"
                            className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-400 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-indigo-300 sm:w-auto"
                        >
                            Ver planes
                        </a>
                        <a
                            href="#contacto"
                            className="w-full rounded-lg border border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:w-auto"
                        >
                            Contactar ventas
                        </a>
                    </div>

                    <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            Migración gratis
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            Sin permanencia
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            Activa en minutos
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="caracteristicas"
                className="border-t border-border bg-muted/40 px-4 py-12 sm:px-6 md:py-16"
            >
                <div className="mx-auto max-w-6xl">
                    <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
                        <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl text-foreground">
                            Características
                        </h2>
                        <p className="text-muted-foreground">
                            Todo lo que necesitas para lanzar y escalar tu proyecto en línea.
                        </p>
                    </div>

                    <div className="hidden gap-6 md:grid md:grid-cols-3">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.title}
                                    className="group rounded-xl border border-border bg-card p-6 transition hover:border-primary/40 hover:bg-accent"
                                >
                                    <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary/20">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-foreground">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div
                        className="-mx-4 scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:hidden"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.title}
                                    className="w-[260px] shrink-0 snap-start rounded-xl border border-border bg-card p-6"
                                >
                                    <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-foreground">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section
                id="agentes"
                className="border-t border-border bg-background px-4 py-12 sm:px-6 md:py-16"
            >
                <div className="mx-auto max-w-6xl">
                    <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            <Sparkles className="h-3 w-3" />
                            Impulsado por IA
                        </div>
                        <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl text-foreground">
                            Agentes de IA
                        </h2>
                        <p className="text-muted-foreground">
                            Desliza y conoce los cerebros digitales open source que ofrecemos.
                        </p>
                    </div>
                </div>

                <div
                    className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-6 md:gap-6 md:px-12"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {agents.map((agent) => (
                        <a
                            key={agent.name}
                            href={agent.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:border-primary/50 hover:shadow-2xl hover:shadow-indigo-500/20 md:w-[320px]"
                        >
                            <div className="mb-5 grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border border-border bg-muted p-3">
                                <img
                                    src={agent.logo}
                                    alt={agent.name}
                                    className="h-full w-full object-contain"
                                />
                            </div>

                            <h3 className="mb-1 text-2xl font-bold text-foreground">
                                {agent.name}
                            </h3>
                            <p className="mb-4 text-sm font-medium text-primary">
                                {agent.subtitle}
                            </p>

                            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                                {agent.description}
                            </p>

                            <ul className="mb-6 space-y-2 text-sm">
                                {agent.bullets.map((b) => (
                                    <li key={b} className="flex items-start gap-2 text-muted-foreground">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-sm font-medium text-primary transition group-hover:text-primary/80">
                                Ver documentación
                                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                            </div>
                        </a>
                    ))}
                </div>
            </section>

            <section
                id="planes"
                className="border-t border-border bg-background px-4 py-12 sm:px-6 md:py-16"
            >
                <div className="mx-auto max-w-6xl">
                    <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
                        <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl text-foreground">
                            Planes y precios
                        </h2>
                        <p className="text-muted-foreground">
                            Elige el plan que mejor se adapta a tu proyecto. Sin contratos, sin sorpresas.
                        </p>
                    </div>

                    <div className="hidden gap-6 md:grid md:grid-cols-3">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative flex flex-col rounded-2xl border p-8 transition ${
                                    plan.highlight
                                        ? 'border-primary bg-gradient-to-b from-primary/10 to-card shadow-2xl shadow-indigo-500/20 md:-translate-y-4'
                                        : 'border-border bg-card hover:border-primary/40'
                                }`}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                                        Más popular
                                    </div>
                                )}

                                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {plan.description}
                                </p>

                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="text-sm text-muted-foreground">desde</span>
                                    <span className="text-5xl font-bold text-foreground">
                                        ${plan.price}
                                    </span>
                                    <span className="text-sm text-muted-foreground">/mes</span>
                                </div>

                                <ul className="mt-6 space-y-3 text-sm">
                                    {plan.features.map((feat) => (
                                        <li key={feat} className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                            <span className="text-foreground">{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                <a
                                    href="#contacto"
                                    className={`mt-8 w-full rounded-lg px-5 py-3 text-center text-sm font-semibold transition ${
                                        plan.highlight
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-indigo-500/30 hover:bg-primary/90'
                                            : 'border border-border bg-card text-foreground hover:bg-accent'
                                    }`}
                                >
                                    Contratar
                                </a>
                            </div>
                        ))}
                    </div>

                    <div
                        className="-mx-4 scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:hidden"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative flex w-[270px] shrink-0 snap-start flex-col rounded-2xl border p-6 ${
                                    plan.highlight
                                        ? 'border-primary bg-gradient-to-b from-primary/10 to-card shadow-2xl shadow-indigo-500/20'
                                        : 'border-border bg-card'
                                }`}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                                        Más popular
                                    </div>
                                )}

                                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {plan.description}
                                </p>

                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-xs text-muted-foreground">desde</span>
                                    <span className="text-4xl font-bold text-foreground">
                                        ${plan.price}
                                    </span>
                                    <span className="text-xs text-muted-foreground">/mes</span>
                                </div>

                                <ul className="mt-4 space-y-2 text-xs">
                                    {plan.features.map((feat) => (
                                        <li key={feat} className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                            <span className="text-foreground">{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                <a
                                    href="#contacto"
                                    className={`mt-6 w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                                        plan.highlight
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-indigo-500/30 hover:bg-primary/90'
                                            : 'border border-border bg-card text-foreground hover:bg-accent'
                                    }`}
                                >
                                    Contratar
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section
                id="faq"
                className="border-t border-border bg-muted/40 px-4 py-12 sm:px-6 md:py-16"
            >
                <div className="mx-auto max-w-3xl">
                    <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
                        <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl text-foreground">
                            Preguntas frecuentes
                        </h2>
                        <p className="text-muted-foreground">
                            Las respuestas a las dudas más comunes de nuestros clientes.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq) => (
                            <FaqItem
                                key={faq.question}
                                question={faq.question}
                                answer={faq.answer}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <footer id="contacto" className="border-t border-border bg-muted/30 px-6 py-4">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:gap-4 sm:text-left">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} {siteTitle}. Todos los derechos reservados.
                    </p>

                    <div className="flex items-center gap-5 text-sm text-muted-foreground">
                        <a href="#" className="transition hover:text-foreground">Privacidad</a>
                        <a href="#" className="transition hover:text-foreground">Términos</a>
                        <a href="#" className="transition hover:text-foreground">Soporte</a>
                    </div>
                </div>
            </footer>

            <ChatWidget settings={chatSettings} />
        </div>
    );
}