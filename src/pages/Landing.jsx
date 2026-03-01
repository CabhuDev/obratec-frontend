import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoImg from '../assets/logo.PNG';
import heroDeviceImg from '../assets/hero-device.webp';
import step1Img from '../assets/step-1-proyecto.webp';
import step2Img from '../assets/step-2-registro.webp';
import step3Img from '../assets/step-3-informe.webp';
import ctaBgImg from '../assets/cta-bg.webp';
import {
  FiFileText,
  FiMessageCircle,
  FiMic,
  FiDownload,
  FiCheckCircle,
  FiArrowRight,
  FiStar,
  FiZap,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiSmartphone
} from 'react-icons/fi';

function Landing() {
  const [activeFaq, setActiveFaq] = useState(null);

  const features = [
    {
      icon: <FiFileText />,
      title: 'Informes Profesionales',
      description: 'Crea informes de obra detallados con fotos, audio y datos estructurados en minutos.'
    },
    {
      icon: <FiMic />,
      title: 'Transcripción IA',
      description: 'Graba notas de voz y convierte automáticamente a texto con Whisper AI.'
    },
    {
      icon: <FiMessageCircle />,
      title: 'Chatbot Experto',
      description: 'Consulta a Patricia, nuestra asistente IA especializada en construcción.'
    },
    {
      icon: <FiDownload />,
      title: 'Exportación PDF',
      description: 'Genera PDFs profesionales con tu branding en un solo clic.'
    },
    {
      icon: <FiZap />,
      title: 'Tiempo Real',
      description: 'Actualiza el progreso de obra en tiempo real desde cualquier dispositivo.'
    },
    {
      icon: <FiShield />,
      title: 'Seguro y Privado',
      description: 'Tus datos protegidos con encriptación de grado empresarial.'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Crea tu proyecto',
      description: 'Configura tu obra con toda la información básica en segundos.',
      image: step1Img,
      imageAlt: 'Crear proyecto de obra en OBRATEC',
    },
    {
      number: '02',
      title: 'Registra el avance',
      description: 'Sube fotos, graba notas de voz o escribe observaciones.',
      image: step2Img,
      imageAlt: 'Registrar avance de obra con OBRATEC',
    },
    {
      number: '03',
      title: 'Genera informes',
      description: 'Exporta PDFs profesionales listos para enviar a clientes.',
      image: step3Img,
      imageAlt: 'Generar informe PDF profesional con OBRATEC',
    },
  ];

  const plans = [
    {
      name: 'Básico',
      price: '9',
      period: '/mes',
      description: 'Para profesionales independientes y autónomos',
      features: [
        '50 informes/mes',
        'Hasta 3 usuarios',
        '5 GB almacenamiento',
        '30 mensajes chatbot IA/mes',
        'Exportación PDF',
        'Soporte por email',
      ],
      cta: 'Empezar 14 días gratis',
      popular: false,
    },
    {
      name: 'Profesional',
      price: '39',
      period: '/mes',
      description: 'Para equipos de trabajo y empresas medianas',
      features: [
        '15 informes/mes',
        'Hasta 10 usuarios',
        '25 GB almacenamiento',
        '70 mensajes chatbot IA/mes',
        'Base de conocimiento',
        'Exportación PDF',
        'Soporte prioritario',
      ],
      cta: 'Empezar 14 días gratis',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '149',
      period: '/mes',
      description: 'Para grandes empresas y constructoras',
      features: [
        'Informes ilimitados',
        'Usuarios ilimitados',
        '100 GB almacenamiento',
        'Chatbot IA ilimitado',
        'Base de conocimiento',
        'API personalizada',
        'Soporte dedicado 24/7',
      ],
      cta: 'Empezar 14 días gratis',
      popular: false,
    },
  ];

  const testimonials = [
    {
      name: 'Carlos Martínez',
      role: 'Jefe de Obra, Constructora ABC',
      avatar: 'CM',
      rating: 5,
      text: 'OBRATEC ha transformado cómo gestionamos nuestros informes. Ahorramos 5 horas semanales por proyecto.'
    },
    {
      name: 'Ana Rodríguez',
      role: 'Directora de Proyectos, BuildTech',
      avatar: 'AR',
      rating: 5,
      text: 'La transcripción de audio es increíble. Grabo mis observaciones en obra y se convierten en texto al instante.'
    },
    {
      name: 'Miguel Sánchez',
      role: 'Arquitecto, MS Arquitectos',
      avatar: 'MS',
      rating: 5,
      text: 'Los PDFs generados son muy profesionales. Mis clientes están impresionados con la calidad.'
    }
  ];

  const faqs = [
    {
      q: '¿Necesito instalar algo?',
      a: 'No, OBRATEC es 100% web. Accede desde cualquier navegador en PC, tablet o móvil.'
    },
    {
      q: '¿Puedo cancelar cuando quiera?',
      a: 'Sí, puedes cancelar tu suscripción en cualquier momento sin penalización.'
    },
    {
      q: '¿Mis datos están seguros?',
      a: 'Absolutamente. Usamos encriptación de grado bancario y cumplimos con GDPR.'
    },
    {
      q: '¿Ofrecen soporte técnico?',
      a: 'Sí, todos los planes incluyen soporte. Professional y Enterprise tienen soporte prioritario.'
    },
    {
      q: '¿Puedo probar antes de pagar?',
      a: 'Sí, puedes crear hasta 2 informes gratis sin tarjeta de crédito. Tienes 14 días de prueba.'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="container">
          <div className="navbar-content">
            <div className="navbar-logo">
              <img src={logoImg} alt="OBRATEC" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
            </div>
            <div className="navbar-links">
              <a href="#features">Características</a>
              <a href="#pricing">Precios</a>
              <a href="#testimonials">Testimonios</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="navbar-actions">
              <Link to="/login" className="btn-nav-login">Iniciar Sesión</Link>
              <Link to="/register" className="btn-nav-cta">Empezar Gratis</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="hero-text"
            >
              <div className="hero-badge">
                <FiTrendingUp /> Gestión de Obra Inteligente
              </div>
              <h1 className="hero-title">
                Informes de obra profesionales en{' '}
                <span className="gradient-text">minutos, no horas</span>
              </h1>
              <p className="hero-description">
                Crea, gestiona y comparte informes de obra con IA. Transcripción automática,
                generación de PDFs y chatbot experto incluidos.
              </p>
              <div className="hero-cta">
                <Link to="/register" className="btn-hero-primary">
                  Prueba Gratis 14 Días <FiArrowRight />
                </Link>
                <Link to="/register" className="btn-hero-secondary">
                  Crear cuenta gratis
                </Link>
              </div>
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="stat-number">1,200+</div>
                  <div className="stat-label">Obras Gestionadas</div>
                </div>
                <div className="hero-stat">
                  <div className="stat-number">5hrs</div>
                  <div className="stat-label">Ahorradas/Semana</div>
                </div>
                <div className="hero-stat">
                  <div className="stat-number">98%</div>
                  <div className="stat-label">Satisfacción</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hero-image"
            >
              <div className="app-preview">
                <img
                  src={heroDeviceImg}
                  alt="Panel de gestión de obra OBRATEC"
                  className="hero-device-img"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Todo lo que necesitas para gestionar tu obra</h2>
            <p>Herramientas potentes diseñadas para profesionales de la construcción</p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="feature-card"
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>Cómo funciona</h2>
            <p>Empieza a crear informes profesionales en 3 simples pasos</p>
          </div>

          <div className="steps-container">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="step-card"
              >
                <div className="step-image-wrap">
                  <img src={step.image} alt={step.imageAlt} className="step-img" />
                </div>
                <div className="step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="pricing-section">
        <div className="container">
          <div className="section-header">
            <h2>Planes adaptados a tu necesidad</h2>
            <p>Empieza gratis, escala cuando lo necesites</p>
          </div>

          <div className="pricing-grid">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`pricing-card ${plan.popular ? 'popular' : ''}`}
              >
                {plan.popular && <div className="popular-badge">Más Popular</div>}
                <h3>{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
                <div className="plan-price">
                  <span className="price-amount">{plan.price !== '-' ? `${plan.price}€` : '—'}</span>
                  <span className="price-period">{plan.period}</span>
                </div>
                <ul className="plan-features">
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      <FiCheckCircle /> {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`btn-plan ${plan.popular ? 'btn-plan-primary' : 'btn-plan-outline'}`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>Lo que dicen nuestros clientes</h2>
            <p>Profesionales que ya confían en OBRATEC</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="testimonial-card"
              >
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} fill="currentColor" />
                  ))}
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.avatar}</div>
                  <div className="author-info">
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-role">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="faq-section">
        <div className="container">
          <div className="section-header">
            <h2>Preguntas Frecuentes</h2>
            <p>Todo lo que necesitas saber sobre OBRATEC</p>
          </div>

          <div className="faq-container">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${activeFaq === index ? 'active' : ''}`}
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              >
                <div className="faq-question">
                  <h3>{faq.q}</h3>
                  <span className="faq-toggle">
                    {activeFaq === index ? '−' : '+'}
                  </span>
                </div>
                {activeFaq === index && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section
        className="cta-section"
        style={{ backgroundImage: `url(${ctaBgImg})` }}
      >
        <div className="cta-section-overlay">
        <div className="container">
          <div className="cta-content">
            <h2>¿Listo para transformar tu gestión de obra?</h2>
            <p>Únete a más de 1,200 profesionales que ya usan OBRATEC</p>
            <div className="cta-buttons">
              <Link to="/register" className="btn-cta-primary">
                Empieza Gratis <FiArrowRight />
              </Link>
              <Link to="/login" className="btn-cta-secondary">
                Iniciar Sesión
              </Link>
            </div>
            <p className="cta-note">
              Sin tarjeta de crédito • 14 días de prueba • Cancela cuando quieras
            </p>
          </div>
        </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src={logoImg} alt="OBRATEC" style={{ height: '36px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              </div>
              <p>Gestión de obra inteligente con IA</p>
              <div className="footer-social">
                <a href="#"><FiUsers /></a>
                <a href="#"><FiMessageCircle /></a>
                <a href="#"><FiSmartphone /></a>
              </div>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Producto</h4>
                <a href="#features">Características</a>
                <a href="#pricing">Precios</a>
                <a href="#demo">Demo</a>
                <a href="#">Actualizaciones</a>
              </div>

              <div className="footer-column">
                <h4>Empresa</h4>
                <a href="#">Sobre Nosotros</a>
                <a href="#">Blog</a>
                <a href="#">Contacto</a>
                <a href="#">Soporte</a>
              </div>

              <div className="footer-column">
                <h4>Legal</h4>
                <a href="#">Privacidad</a>
                <a href="#">Términos</a>
                <a href="#">Cookies</a>
                <a href="#">GDPR</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 OBRATEC. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
