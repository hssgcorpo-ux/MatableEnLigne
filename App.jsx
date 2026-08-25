import { useState, useEffect } from "react";
import {
  Lock, Mail, Store, Plus, Trash2, Eye, LogOut, Check,
  Image as ImageIcon, Instagram, MapPin, Phone, Clock, X, Star, CalendarCheck, Inbox, Share2, QrCode, Copy,
} from "lucide-react";
import { supabase } from "./supabaseClient";

const C = {
  cream: "#F6EFE2",
  charcoal: "#231C16",
  wine: "#6E2430",
  pine: "#3C4A3A",
};
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
};

const PALETTES = [
  { id: "wine", label: "Bistrot", bg: "#231C16", accent: "#B4894F", wine: "#6E2430" },
  { id: "pine", label: "Terroir", bg: "#1E2620", accent: "#C9A876", wine: "#3C4A3A" },
  { id: "azur", label: "Bord de mer", bg: "#132228", accent: "#D8B36A", wine: "#1F4E5F" },
];

const CATEGORIES = ["Entrées", "Plats", "Desserts", "Boissons"];

// 👉 Colle ici ton lien de paiement Stripe (créé sur dashboard.stripe.com/payment-links)
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/COLLE_TON_LIEN_ICI";

const TIME_SLOTS = ["12:00", "12:30", "13:00", "13:30", "14:00", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];

const FONTS = [
  { id: "elegant", label: "Élégant", stack: "Georgia, 'Times New Roman', serif" },
  { id: "moderne", label: "Moderne", stack: "'Helvetica Neue', Arial, sans-serif" },
  { id: "convivial", label: "Convivial", stack: "'Trebuchet MS', sans-serif" },
  { id: "classique", label: "Classique", stack: "'Times New Roman', Times, serif" },
];

const emptyMenuItem = (category) => ({
  id: Math.random().toString(36).slice(2, 8),
  category: category || "Plats",
  name: "",
  desc: "",
  price: "",
  featured: false,
});

const emptyTestimonial = () => ({
  id: Math.random().toString(36).slice(2, 8),
  name: "",
  text: "",
  stars: 5,
});

function slugify(str) {
  return (str || "restaurant")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "restaurant";
}

function seatsBookedFor(site, date, time) {
  if (!date || !time) return 0;
  return site.reservations
    .filter((r) => r.date === date && r.time === time)
    .reduce((sum, r) => sum + (r.people === "7+" ? 7 : Number(r.people) || 0), 0);
}

const defaultSite = (restaurantName) => ({
  name: restaurantName || "Mon Restaurant",
  tagline: "Une cuisine simple, faite avec soin.",
  about: "",
  address: "",
  phone: "",
  instagram: "",
  hours: "Mar – Sam, 12h–14h30 · 19h–22h30",
  palette: "wine",
  font: "elegant",
  googleUrl: "",
  totalSeats: 0,
  reservations: [],
  gallery: [],
  menuPhotos: [],
  testimonials: [
    { ...emptyTestimonial(), name: "Camille", text: "Un vrai bistrot comme on n'en fait plus. Accueil chaleureux et cuisine généreuse.", stars: 5 },
  ],
  menu: [
    { ...emptyMenuItem("Entrées"), name: "Entrée du jour", desc: "selon arrivage", price: "8€" },
    { ...emptyMenuItem("Plats"), name: "Plat du jour", desc: "", price: "16€" },
  ],
});

// Exemple complet utilisé uniquement par le bouton "Voir un exemple" de la page d'accueil
const demoSite = () => ({
  name: "Le Petit Chêne",
  tagline: "Une cuisine franche, à deux pas de chez vous.",
  about: "Bistrot de quartier depuis 2014, Le Petit Chêne propose une cuisine de saison, une ardoise qui change chaque semaine, et une salle pensée pour les longs déjeuners entre amis.",
  address: "12 Rue des Tanneurs, Quartier Saint-Michel",
  phone: "01 23 45 67 89",
  instagram: "lepetitchene",
  hours: "Mar – Sam, 12h–14h30 · 19h–22h30",
  palette: "wine",
  font: "elegant",
  googleUrl: "https://www.google.com/maps",
  totalSeats: 24,
  reservations: [],
  gallery: [
    "grad:Salle principale:wine",
    "grad:Terrasse:pine",
    "grad:Comptoir:gold",
    "grad:Plat du jour:wine",
  ],
  menuPhotos: [],
  testimonials: [
    { ...emptyTestimonial(), name: "Camille", text: "Un vrai bistrot comme on n'en fait plus. La bavette était parfaite et le service très chaleureux.", stars: 5 },
    { ...emptyTestimonial(), name: "Karim", text: "La terrasse est un petit bijou l'été. On y retourne dès qu'on peut.", stars: 5 },
    { ...emptyTestimonial(), name: "Léa", text: "Cuisine généreuse, ardoise toujours différente. Pensez à réserver le week-end.", stars: 4 },
  ],
  menu: [
    { ...emptyMenuItem("Entrées"), name: "Terrine de campagne", desc: "pain de campagne, cornichons maison", price: "9€" },
    { ...emptyMenuItem("Entrées"), name: "Velouté de saison", desc: "selon arrivage du marché", price: "8€" },
    { ...emptyMenuItem("Plats"), name: "Bavette, échalotes confites", desc: "frites maison", price: "19€", featured: true },
    { ...emptyMenuItem("Plats"), name: "Volaille rôtie, jus corsé", desc: "purée de saison", price: "18€" },
    { ...emptyMenuItem("Plats"), name: "Risotto du moment", desc: "végétarien", price: "16€" },
    { ...emptyMenuItem("Desserts"), name: "Tarte fine aux pommes", desc: "", price: "7€" },
    { ...emptyMenuItem("Boissons"), name: "Verre de vin nature", desc: "", price: "6€" },
  ],
});

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.readAsDataURL(file);
  });
}

function Input({ icon, ...props }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "10px 12px", background: "#fff" }}>
      {icon}
      <input {...props} style={{ width: "100%", outline: "none", fontSize: 14, background: "transparent", border: "none", color: C.charcoal }} />
    </div>
  );
}

function Field({ label, value, onChange, textarea, placeholder }) {
  const style = {
    width: "100%", fontSize: 14, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6,
    padding: "8px 12px", outline: "none", color: C.charcoal, background: "#fff", fontFamily: "inherit",
  };
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: rgba(C.charcoal, 0.7), display: "block", marginBottom: 4 }}>{label}</label>
      {textarea ? (
        <textarea value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} rows={3} style={{ ...style, resize: "vertical" }} />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={style} />
      )}
    </div>
  );
}

function useReveal() {
  const [visible, setVisible] = useState(false);
  const ref = (node) => {
    if (!node || node._observed) return;
    node._observed = true;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(node);
  };
  return [ref, visible];
}

function Reveal({ children, delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity .6s ease ${delay}s, transform .6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const GRAD_COLORS = {
  wine: ["#6E2430", "#3d1119"],
  pine: ["#3C4A3A", "#1c231c"],
  gold: ["#B4894F", "#5c4326"],
};

// Affiche une vraie photo (uploadée par l'utilisateur), ou une vignette stylée
// pour les entrées de démonstration (préfixées "grad:Label:couleur") qui ne
// dépendent d'aucune image externe.
function Photo({ src, alt, style, onClick, className }) {
  if (typeof src === "string" && src.startsWith("grad:")) {
    const [, label, colorKey] = src.split(":");
    const [c1, c2] = GRAD_COLORS[colorKey] || GRAD_COLORS.wine;
    return (
      <div
        onClick={onClick}
        className={className}
        style={{
          ...style,
          background: `linear-gradient(150deg, ${c1}, ${c2})`,
          display: "flex",
          alignItems: "flex-end",
          padding: 12,
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontStyle: "italic", fontFamily: "Georgia, serif" }}>{label}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} onClick={onClick} className={className} style={style} />;
}

function SectionCard({ title, action, children }) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: rgba(C.charcoal, 0.8) }}>{title}</h2>
        {action}
      </div>
      <div style={{ background: "#fff", border: `1px solid ${rgba(C.charcoal, 0.1)}`, borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </section>
  );
}

export default function App() {
  const [screen, setScreen] = useState("checking"); // checking | landing | login | signup | dashboard | preview
  const [demoMode, setDemoMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [site, setSite] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showReservation, setShowReservation] = useState(false);
  const [reservationSent, setReservationSent] = useState(false);
  const [resName, setResName] = useState("");
  const [resPhone, setResPhone] = useState("");
  const [resDate, setResDate] = useState("");
  const [resTime, setResTime] = useState("");
  const [resPeople, setResPeople] = useState("2");
  const [resError, setResError] = useState("");
  const [showManualRes, setShowManualRes] = useState(false);
  const [manName, setManName] = useState("");
  const [manPhone, setManPhone] = useState("");
  const [manDate, setManDate] = useState("");
  const [manTime, setManTime] = useState("");
  const [manPeople, setManPeople] = useState("2");
  const [manError, setManError] = useState("");
  const [heroVisible, setHeroVisible] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Vérifie si l'utilisateur est déjà connecté (session persistante)
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadSiteFor(session.user.id, session.user.email);
      } else {
        setScreen("landing");
      }
    }
    checkSession();
  }, []);

  // Ferme la photo agrandie avec la touche Échap
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Titre de l'onglet du navigateur, cohérent avec l'écran affiché
  useEffect(() => {
    if (screen === "preview" && site) {
      document.title = `${site.name} — Menu & réservation`;
    } else if (screen === "dashboard" && site) {
      document.title = `Tableau de bord — ${site.name}`;
    } else {
      document.title = "TableEnLigne — Sites pour restaurants";
    }
  }, [screen, site?.name]);

  useEffect(() => {
    if (screen === "preview") {
      setHeroVisible(false);
      const t = setTimeout(() => setHeroVisible(true), 60);
      return () => clearTimeout(t);
    }
  }, [screen]);

  async function loadSiteFor(userId, userEmail) {
    const { data, error: fetchError } = await supabase
      .from("sites")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (fetchError) {
      setError("Impossible de charger votre site : " + fetchError.message);
      setScreen("landing");
      return;
    }
    if (data) {
      setSite(data.data);
    } else {
      const fresh = defaultSite(userEmail);
      await supabase.from("sites").insert({ user_id: userId, data: fresh });
      setSite(fresh);
    }
    setScreen("dashboard");
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    if (!email || !password || !restaurantName) {
      setError("Remplis tous les champs.");
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message === "User already registered" ? "Un compte existe déjà avec cet email." : signUpError.message);
      return;
    }
    if (!data.session) {
      setError("Compte créé ! Vérifiez votre email pour confirmer, puis connectez-vous.");
      setScreen("login");
      return;
    }
    const fresh = defaultSite(restaurantName);
    await supabase.from("sites").insert({ user_id: data.user.id, data: fresh });
    setSite(fresh);
    setScreen("dashboard");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    await loadSiteFor(data.user.id, data.user.email);
  }

  async function persistSite(next) {
    setSite(next);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("sites").update({ data: next, updated_at: new Date().toISOString() }).eq("user_id", session.user.id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function updateField(field, value) {
    persistSite({ ...site, [field]: value });
  }
  function updateMenuItem(id, field, value) {
    persistSite({ ...site, menu: site.menu.map((m) => (m.id === id ? { ...m, [field]: value } : m)) });
  }
  function addMenuItem(category) {
    persistSite({ ...site, menu: [...site.menu, emptyMenuItem(category)] });
  }
  function removeMenuItem(id) {
    persistSite({ ...site, menu: site.menu.filter((m) => m.id !== id) });
  }
  async function addPhotos(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const dataUrls = await Promise.all(files.map(readImageAsDataUrl));
      persistSite({ ...site, gallery: [...site.gallery, ...dataUrls] });
    } catch {
      setError("Impossible de charger une des images.");
    } finally {
      setUploading(false);
    }
  }
  function removePhoto(idx) {
    persistSite({ ...site, gallery: site.gallery.filter((_, i) => i !== idx) });
  }
  async function addMenuPhotos(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const dataUrls = await Promise.all(files.map(readImageAsDataUrl));
      persistSite({ ...site, menuPhotos: [...site.menuPhotos, ...dataUrls] });
    } catch {
      setError("Impossible de charger une des images.");
    } finally {
      setUploading(false);
    }
  }
  function removeMenuPhoto(idx) {
    persistSite({ ...site, menuPhotos: site.menuPhotos.filter((_, i) => i !== idx) });
  }
  function toggleFeatured(id) {
    persistSite({ ...site, menu: site.menu.map((m) => (m.id === id ? { ...m, featured: !m.featured } : m)) });
  }
  function addTestimonial() {
    persistSite({ ...site, testimonials: [...site.testimonials, emptyTestimonial()] });
  }
  function updateTestimonial(id, field, value) {
    persistSite({ ...site, testimonials: site.testimonials.map((t) => (t.id === id ? { ...t, [field]: value } : t)) });
  }
  function removeTestimonial(id) {
    persistSite({ ...site, testimonials: site.testimonials.filter((t) => t.id !== id) });
  }
  function copySiteLink() {
    const link = `https://tableenligne.fr/${slugify(site.name)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 1800);
      }).catch(() => {});
    }
  }
  function submitReservation(e) {
    e.preventDefault();
    const already = seatsBookedFor(site, resDate, resTime);
    const requested = resPeople === "7+" ? 7 : Number(resPeople);
    if (site.totalSeats > 0 && already + requested > site.totalSeats) {
      setResError(`Complet pour ce créneau (${site.totalSeats - already} place(s) restante(s)). Choisissez un autre horaire.`);
      return;
    }
    setResError("");
    const entry = { id: Math.random().toString(36).slice(2, 8), name: resName, phone: resPhone, date: resDate, time: resTime, people: resPeople, source: "site", receivedAt: new Date().toLocaleString("fr-FR") };
    persistSite({ ...site, reservations: [entry, ...site.reservations] });
    setReservationSent(true);
    setResName(""); setResPhone(""); setResDate(""); setResTime(""); setResPeople("2");
  }
  function addManualReservation(data) {
    const entry = { id: Math.random().toString(36).slice(2, 8), ...data, source: "manuel", receivedAt: new Date().toLocaleString("fr-FR") };
    persistSite({ ...site, reservations: [entry, ...site.reservations] });
  }
  function deleteReservation(id) {
    persistSite({ ...site, reservations: site.reservations.filter((r) => r.id !== id) });
  }
  async function logout() {
    await supabase.auth.signOut();
    setScreen("landing");
    setEmail("");
    setPassword("");
    setRestaurantName("");
    setSite(null);
    setError("");
  }

  const pal = PALETTES.find((p) => p.id === (site?.palette || "wine"));

  if (screen === "checking") {
    return (
      <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 13, color: rgba(C.charcoal, 0.4), fontFamily: "system-ui, sans-serif" }}>Chargement...</p>
      </div>
    );
  }

  // ---------- AUTH ----------
  // ---------- LANDING ----------
  if (screen === "landing") {
    return (
      <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "system-ui, sans-serif", color: C.charcoal }}>
        <style>{`
          .lp-btn { transition: transform .2s ease; }
          .lp-btn:hover { transform: translateY(-2px); }
          .lp-row { transition: transform .2s ease; }
          .lp-row:hover { transform: translateX(4px); }
          @media (max-width: 680px) {
            .lp-hero-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.wine, fontWeight: 700, fontSize: 16 }}>
            <Store size={20} /> TableEnLigne
          </div>
          <button onClick={() => setScreen("login")} style={{ fontSize: 13, background: "none", border: "none", color: C.charcoal, cursor: "pointer", fontWeight: 500 }}>
            Se connecter
          </button>
        </div>

        {/* HERO — asymétrique, texte + carte menu illustrative */}
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 24px 64px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center" }} className="lp-hero-grid">
          <div>
            <div style={{ display: "inline-block", fontSize: 12, fontWeight: 600, color: C.wine, background: rgba(C.wine, 0.08), padding: "5px 12px", borderRadius: 20, marginBottom: 22 }}>
              Pensé pour les restaurants indépendants
            </div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(30px, 4.2vw, 46px)", fontWeight: 600, lineHeight: 1.12, margin: "0 0 18px" }}>
              Votre restaurant mérite mieux qu'une page Facebook.
            </h1>
            <p style={{ fontSize: 15.5, color: rgba(C.charcoal, 0.65), maxWidth: 440, margin: "0 0 30px", lineHeight: 1.6 }}>
              Un site que vous gérez vous-même — menu, photos, réservations — configuré avec vous en une après-midi. 24€/mois, sans engagement.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                className="lp-btn"
                onClick={() => setScreen("signup")}
                style={{ background: C.wine, color: C.cream, border: "none", borderRadius: 8, padding: "13px 26px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Créer mon site gratuitement
              </button>
              <button
                className="lp-btn"
                onClick={() => { setSite(demoSite()); setDemoMode(true); setScreen("preview"); }}
                style={{ background: "transparent", color: C.charcoal, border: `1px solid ${rgba(C.charcoal, 0.2)}`, borderRadius: 8, padding: "13px 26px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Voir un exemple →
              </button>
            </div>
          </div>

          {/* Vignette illustrative façon carte de restaurant */}
          <Reveal>
            <div style={{ background: C.charcoal, borderRadius: 16, padding: 28, transform: "rotate(1.5deg)", boxShadow: "0 24px 50px rgba(35,28,22,0.18)" }}>
              <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#B4894F", fontSize: 13, margin: "0 0 4px" }}>Bienvenue chez</p>
              <p style={{ fontFamily: "Georgia, serif", color: C.cream, fontSize: 22, fontWeight: 600, margin: "0 0 18px" }}>Le Petit Chêne</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["Bavette, échalotes confites", "19€"], ["Volaille rôtie, jus corsé", "18€"], ["Tarte fine aux pommes", "7€"]].map(([n, p], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ color: C.cream, fontSize: 13 }}>{n}</span>
                    <span style={{ flex: 1, borderBottom: "1px dotted rgba(255,255,255,0.25)", position: "relative", top: -3 }} />
                    <span style={{ color: "#B4894F", fontSize: 13, fontFamily: "Georgia, serif" }}>{p}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarCheck size={14} color="#B4894F" />
                <span style={{ fontSize: 11.5, color: "rgba(246,239,226,0.75)" }}>Réservation en ligne activée</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* FEATURES — liste horizontale, plus éditoriale que des cartes */}
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px 64px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { icon: <ImageIcon size={18} color={C.wine} />, title: "Photos & menu à jour", text: "Ajoutez vos photos et votre carte vous-même, en quelques clics." },
              { icon: <CalendarCheck size={18} color={C.wine} />, title: "Réservations en ligne", text: "Vos clients réservent directement, avec suivi des places disponibles." },
              { icon: <Star size={18} color={C.wine} />, title: "Avis clients mis en avant", text: "Vos meilleurs retours affichés pour rassurer les nouveaux visiteurs." },
              { icon: <QrCode size={18} color={C.wine} />, title: "QR code pour vos tables", text: "Vos clients scannent et arrivent directement sur votre site." },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <div className="lp-row" style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "18px 0", borderTop: i > 0 ? `1px solid ${rgba(C.charcoal, 0.08)}` : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: rgba(C.wine, 0.08), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <h3 style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 3 }}>{f.title}</h3>
                    <p style={{ fontSize: 13, color: rgba(C.charcoal, 0.6), lineHeight: 1.5 }}>{f.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* COMMENT ÇA MARCHE — stepper horizontal compact */}
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 64px" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontStyle: "italic", marginBottom: 24 }}>Comment ça marche</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
            {[
              { n: "1", title: "On configure ensemble", text: "Photos, menu, horaires — 15 minutes suffisent." },
              { n: "2", title: "Votre site est en ligne", text: "Un lien et un QR code prêts à imprimer sur vos tables." },
              { n: "3", title: "Vous gérez seul, ensuite", text: "Changez un prix ou une photo en 30 secondes." },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div style={{ background: "#fff", border: `1px solid ${rgba(C.charcoal, 0.08)}`, borderRadius: 10, padding: 18 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.wine, color: C.cream, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, marginBottom: 10 }}>
                    {s.n}
                  </div>
                  <h3 style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>{s.title}</h3>
                  <p style={{ fontSize: 12, color: rgba(C.charcoal, 0.6), lineHeight: 1.5 }}>{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* PRICING */}
        <div style={{ background: C.charcoal, color: C.cream, padding: "56px 24px" }}>
          <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontStyle: "italic", marginBottom: 8 }}>Un seul prix, simple</h2>
            <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 26 }}>Sans engagement. Résiliable à tout moment.</p>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 26 }}>
              <div style={{ fontSize: 38, fontWeight: 700 }}>24€<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>/mois</span></div>
              <ul style={{ listStyle: "none", padding: 0, margin: "18px 0 0", display: "flex", flexDirection: "column", gap: 9, fontSize: 13, opacity: 0.85, textAlign: "left" }}>
                {["Site complet et personnalisable", "Réservations en ligne illimitées", "Photos et menu à jour vous-même", "QR code inclus"].map((f, i) => (
                  <li key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}><Check size={14} color="#B4894F" /> {f}</li>
                ))}
              </ul>
              <button
                className="lp-btn"
                onClick={() => setScreen("signup")}
                style={{ width: "100%", marginTop: 22, background: "#B4894F", color: C.charcoal, border: "none", borderRadius: 8, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                Commencer
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "20px", fontSize: 11, color: rgba(C.charcoal, 0.4) }}>
          TableEnLigne — fait pour les restaurants indépendants.
        </div>
      </div>
    );
  }

  if (screen === "login" || screen === "signup") {
    const isSignup = screen === "signup";
    return (
      <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div onClick={() => setScreen("landing")} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: C.wine, marginBottom: 8, cursor: "pointer" }}>
              <Store size={22} />
              <span style={{ fontWeight: 600 }}>TableEnLigne</span>
            </div>
            <p style={{ fontSize: 14, color: rgba(C.charcoal, 0.6) }}>
              {isSignup ? "Crée le site de ton restaurant" : "Connexion à ton espace"}
            </p>
            <p style={{ fontSize: 11, color: rgba(C.charcoal, 0.4), marginTop: 6 }}>
              Prototype de démo — les données sont gardées le temps de cette session.
            </p>
          </div>

          <form
            onSubmit={isSignup ? handleSignup : handleLogin}
            style={{ background: "#fff", border: `1px solid ${rgba(C.charcoal, 0.1)}`, borderRadius: 10, padding: 24, display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 6px 20px rgba(35,28,22,0.06)" }}
          >
            {isSignup && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: rgba(C.charcoal, 0.7), display: "block", marginBottom: 4 }}>Nom du restaurant</label>
                <Input icon={<Store size={16} color={rgba(C.charcoal, 0.4)} />} placeholder="Le Petit Chêne" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: rgba(C.charcoal, 0.7), display: "block", marginBottom: 4 }}>Email</label>
              <Input icon={<Mail size={16} color={rgba(C.charcoal, 0.4)} />} type="email" placeholder="toi@restaurant.fr" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: rgba(C.charcoal, 0.7), display: "block", marginBottom: 4 }}>Mot de passe</label>
              <Input icon={<Lock size={16} color={rgba(C.charcoal, 0.4)} />} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error && <p style={{ fontSize: 12, color: C.wine }}>{error}</p>}

            <button type="submit" disabled={loading} style={{ width: "100%", background: C.wine, color: C.cream, borderRadius: 6, padding: "12px 0", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Un instant..." : isSignup ? "Créer mon compte" : "Se connecter"}
            </button>
          </form>

          <button
            onClick={() => { setError(""); setScreen(isSignup ? "login" : "signup"); }}
            style={{ width: "100%", marginTop: 16, background: "#fff", border: `1px solid ${rgba(C.wine, 0.3)}`, color: C.wine, borderRadius: 6, padding: "12px 0", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          >
            {isSignup ? "J'ai déjà un compte — Se connecter" : "Pas encore de compte — Créer un site"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- PUBLIC PREVIEW ----------
  if (screen === "preview" && site) {
    const grouped = CATEGORIES.map((cat) => ({ cat, items: site.menu.filter((m) => m.category === cat) })).filter((g) => g.items.length > 0);
    const hero = site.gallery[0];
    const restGallery = site.gallery.slice(1);
    const fontStack = (FONTS.find((f) => f.id === site.font) || FONTS[0]).stack;

    return (
      <div style={{ minHeight: "100vh", background: pal.bg, color: C.cream, fontFamily: fontStack }}>
        <style>{`
          .btn-anim { transition: transform .2s ease, opacity .2s ease; }
          .btn-anim:hover { transform: translateY(-2px) scale(1.02); }
          .gallery-img { transition: transform .4s ease; }
          .gallery-img:hover { transform: scale(1.04); }
          .nav-link { transition: opacity .2s ease; cursor: pointer; opacity: 0.7; }
          .nav-link:hover { opacity: 1; }
          @keyframes modalIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        `}</style>

        <div style={{ position: "sticky", top: 0, zIndex: 20, padding: "14px 24px", background: rgba(pal.bg, 0.85), backdropFilter: "blur(8px)", borderBottom: `1px solid rgba(255,255,255,0.08)`, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "system-ui, sans-serif" }}>
          <button onClick={() => (demoMode ? setScreen("landing") : setScreen("dashboard"))} style={{ fontSize: 12, opacity: 0.6, background: "none", border: "none", color: C.cream, cursor: "pointer" }}>
            {demoMode ? "← Retour à l'accueil" : "← Édition"}
          </button>
          <div style={{ display: "flex", gap: 20, fontSize: 12 }}>
            {site.gallery.length > 1 && (
              <span className="nav-link" onClick={() => document.getElementById("rp-ambiance")?.scrollIntoView({ behavior: "smooth" })}>
                Ambiance
              </span>
            )}
            {grouped.length > 0 && (
              <span className="nav-link" onClick={() => document.getElementById("rp-carte")?.scrollIntoView({ behavior: "smooth" })}>
                La carte
              </span>
            )}
            <span className="nav-link" style={{ fontWeight: 600, opacity: 1 }} onClick={() => { setShowReservation(true); setReservationSent(false); }}>
              Réserver
            </span>
          </div>
        </div>

        {/* HERO */}
        <div style={{ position: "relative", height: hero ? 340 : 200, overflow: "hidden" }}>
          {hero ? (
            <Photo
              src={hero}
              alt={site.name}
              onClick={() => setLightbox(hero)}
              style={{
                width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in",
                transform: heroVisible ? "scale(1)" : "scale(1.08)",
                opacity: heroVisible ? 1 : 0,
                transition: "transform 1.1s ease, opacity 1s ease",
              }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: `linear-gradient(160deg, ${pal.wine}, ${pal.bg})` }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,0.15), ${pal.bg} 95%)` }} />
          <div
            style={{
              position: "absolute", bottom: 28, left: 0, right: 0, padding: "0 28px", maxWidth: 640, margin: "0 auto",
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(14px)",
              transition: "opacity .7s ease .15s, transform .7s ease .15s",
            }}
          >
            <p style={{ fontStyle: "italic", color: pal.accent, marginBottom: 4 }}>Bienvenue chez</p>
            <h1 style={{ fontSize: 38, fontWeight: 600, margin: 0 }}>{site.name}</h1>
          </div>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 24px 64px" }}>
          <div
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(10px)",
              transition: "opacity .7s ease .3s, transform .7s ease .3s",
            }}
          >
            <p style={{ opacity: 0.8, maxWidth: 460, fontSize: 16 }}>{site.tagline}</p>
            {site.about && <p style={{ opacity: 0.65, maxWidth: 460, fontSize: 14, marginTop: 14, fontFamily: "system-ui, sans-serif" }}>{site.about}</p>}

            <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap", fontFamily: "system-ui, sans-serif" }}>
              <button
                className="btn-anim"
                onClick={() => { setShowReservation(true); setReservationSent(false); }}
                style={{ display: "flex", alignItems: "center", gap: 6, background: pal.accent, color: pal.bg, border: "none", borderRadius: 6, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                <CalendarCheck size={15} /> Réserver une table
              </button>
              {site.googleUrl && (
                <a
                  href={site.googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-anim"
                  style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid rgba(255,255,255,0.25)`, color: C.cream, borderRadius: 6, padding: "10px 18px", fontSize: 13, textDecoration: "none" }}
                >
                  <Star size={15} /> Voir nos avis Google
                </a>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 28, fontSize: 12, opacity: 0.75, marginTop: 32, marginBottom: 40, flexWrap: "wrap", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
              <Clock size={14} style={{ marginTop: 2, flexShrink: 0 }} />
              <span>{site.hours}</span>
            </div>
            {site.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", gap: 6, alignItems: "flex-start", color: "inherit", textDecoration: "none" }}
              >
                <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{site.address}</span>
              </a>
            )}
            {site.phone && (
              <a href={`tel:${site.phone.replace(/\s+/g, "")}`} style={{ display: "flex", gap: 6, alignItems: "flex-start", color: "inherit", textDecoration: "none" }}>
                <Phone size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{site.phone}</span>
              </a>
            )}
            {site.instagram && (
              <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <Instagram size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>@{site.instagram.replace(/^@/, "")}</span>
              </div>
            )}
          </div>

          {restGallery.length > 0 && (
            <div id="rp-ambiance" style={{ marginBottom: 48, scrollMarginTop: 70 }}>
              <h2 style={{ fontSize: 18, fontStyle: "italic", color: pal.accent, marginBottom: 16 }}>L'ambiance</h2>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(restGallery.length, 3)}, 1fr)`, gap: 10 }}>
                {restGallery.map((img, i) => (
                  <Reveal key={i} delay={i * 0.08}>
                    <Photo
                      className="gallery-img"
                      src={img}
                      alt=""
                      onClick={() => setLightbox(img)}
                      style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 6, cursor: "zoom-in" }}
                    />
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          {site.menuPhotos.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 18, fontStyle: "italic", color: pal.accent, marginBottom: 16 }}>Notre carte</h2>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(site.menuPhotos.length, 2)}, 1fr)`, gap: 10 }}>
                {site.menuPhotos.map((img, i) => (
                  <img
                    key={i}
                    className="gallery-img"
                    src={img}
                    alt="Menu"
                    onClick={() => setLightbox(img)}
                    style={{ width: "100%", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", cursor: "zoom-in" }}
                  />
                ))}
              </div>
            </div>
          )}

          {grouped.length > 0 && (
            <div id="rp-carte" style={{ scrollMarginTop: 70 }}>
              <h2 style={{ fontSize: 18, fontStyle: "italic", color: pal.accent, marginBottom: 20 }}>La carte</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                {grouped.map((g, gi) => (
                  <Reveal key={g.cat} delay={gi * 0.1}>
                  <div>
                    <h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.55, marginBottom: 12, fontFamily: "system-ui, sans-serif" }}>{g.cat}</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {g.items.map((item) => (
                        <div key={item.id}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                            <span style={{ fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                              {item.featured && <Star size={13} color={pal.accent} fill={pal.accent} />}
                              {item.name || "—"}
                            </span>
                            <span style={{ flex: 1, borderBottom: "1px dotted rgba(255,255,255,0.25)", position: "relative", top: -4 }} />
                            <span style={{ fontSize: 15 }}>{item.price}</span>
                          </div>
                          {item.desc && <p style={{ fontSize: 12, opacity: 0.55, marginTop: 2, fontFamily: "system-ui, sans-serif" }}>{item.desc}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          {site.testimonials.filter((t) => t.name || t.text).length > 0 && (
            <div style={{ marginTop: 56 }}>
              <h2 style={{ fontSize: 18, fontStyle: "italic", color: pal.accent, marginBottom: 20 }}>Ce qu'on en dit</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {site.testimonials.filter((t) => t.name || t.text).map((t, i) => (
                  <Reveal key={t.id} delay={i * 0.08}>
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 16 }}>
                      <div style={{ color: pal.accent, fontSize: 13, marginBottom: 6, letterSpacing: 2 }}>{"★".repeat(t.stars)}</div>
                      {t.text && <p style={{ fontSize: 13, opacity: 0.8, fontFamily: "system-ui, sans-serif" }}>{t.text}</p>}
                      {t.name && <p style={{ fontSize: 11, opacity: 0.5, marginTop: 8, fontFamily: "system-ui, sans-serif" }}>— {t.name}</p>}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "system-ui, sans-serif" }}>
            <span style={{ fontSize: 11, opacity: 0.4 }}>Site créé avec TableEnLigne</span>
            <button
              className="btn-anim"
              onClick={() => {
                const link = `https://tableenligne.fr/${slugify(site.name)}`;
                if (navigator.share) {
                  navigator.share({ title: site.name, url: link }).catch(() => {});
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(link);
                }
              }}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid rgba(255,255,255,0.2)`, color: C.cream, borderRadius: 6, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}
            >
              <Share2 size={13} /> Partager
            </button>
          </div>
        </div>

        {showReservation && (
          <div
            onClick={() => setShowReservation(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: C.cream, color: C.charcoal, borderRadius: 10, padding: 24, width: "100%", maxWidth: 360, fontFamily: "system-ui, sans-serif", position: "relative", animation: "modalIn .25s ease" }}
            >
              <button onClick={() => setShowReservation(false)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", color: rgba(C.charcoal, 0.4) }}>
                <X size={18} />
              </button>
              {reservationSent ? (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <Check size={28} color={C.pine} style={{ marginBottom: 10 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Demande envoyée</p>
                  <p style={{ fontSize: 12, color: rgba(C.charcoal, 0.6) }}>{site.name} vous confirmera par téléphone.</p>
                </div>
              ) : (
                <form onSubmit={submitReservation} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Réserver chez {site.name}</h3>
                  <input required placeholder="Votre nom" value={resName} onChange={(e) => setResName(e.target.value)} style={{ fontSize: 14, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "10px 12px", outline: "none" }} />
                  <input required placeholder="Téléphone" value={resPhone} onChange={(e) => setResPhone(e.target.value)} style={{ fontSize: 14, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "10px 12px", outline: "none" }} />
                  <input required type="date" value={resDate} onChange={(e) => { setResDate(e.target.value); setResError(""); }} style={{ fontSize: 14, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "10px 12px", outline: "none" }} />
                  <select required value={resTime} onChange={(e) => { setResTime(e.target.value); setResError(""); }} style={{ fontSize: 14, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "10px 12px", outline: "none", color: resTime ? C.charcoal : rgba(C.charcoal, 0.4) }}>
                    <option value="" disabled>Heure souhaitée</option>
                    {TIME_SLOTS.map((t) => {
                      const booked = seatsBookedFor(site, resDate, t);
                      const remaining = site.totalSeats > 0 ? site.totalSeats - booked : null;
                      const full = remaining !== null && remaining <= 0;
                      return (
                        <option key={t} value={t} disabled={full}>
                          {t}{remaining !== null ? (full ? " — complet" : ` — ${remaining} place(s) restante(s)`) : ""}
                        </option>
                      );
                    })}
                  </select>
                  <select value={resPeople} onChange={(e) => { setResPeople(e.target.value); setResError(""); }} style={{ fontSize: 14, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "10px 12px", outline: "none" }}>
                    {[1, 2, 3, 4, 5, 6, "7+"].map((n) => <option key={n} value={n}>{n} personne{n !== 1 ? "s" : ""}</option>)}
                  </select>
                  {resError && <p style={{ fontSize: 12, color: C.wine }}>{resError}</p>}
                  <button type="submit" style={{ background: C.wine, color: C.cream, border: "none", borderRadius: 6, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    Envoyer la demande
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {lightbox && (
          <div
            onClick={() => setLightbox(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(10,8,6,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60, cursor: "zoom-out", animation: "modalIn .2s ease" }}
          >
            <button
              onClick={() => setLightbox(null)}
              style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <X size={18} color="#fff" />
            </button>
            <img src={lightbox} alt="" style={{ maxWidth: "100%", maxHeight: "88vh", borderRadius: 8, objectFit: "contain" }} onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </div>
    );
  }

  // ---------- DASHBOARD ----------
  if (screen === "dashboard" && site) {
    const checklist = [
      { done: !!site.gallery.length, label: "Ajouter au moins une photo" },
      { done: site.menu.some((m) => m.name.trim()), label: "Renseigner au moins un plat" },
      { done: !!site.address, label: "Ajouter l'adresse" },
      { done: !!site.phone, label: "Ajouter le téléphone" },
      { done: !!site.about, label: "Écrire une description" },
      { done: !!site.googleUrl, label: "Ajouter le lien des avis Google" },
    ];
    const doneCount = checklist.filter((c) => c.done).length;
    const isComplete = doneCount === checklist.length;

    return (
      <div style={{ minHeight: "100vh", background: C.cream }}>
        <div style={{ borderBottom: `1px solid ${rgba(C.charcoal, 0.1)}`, background: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.wine, fontWeight: 600, fontSize: 14 }}>
              <Store size={18} /> TableEnLigne
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {saved && (
                <span style={{ fontSize: 12, color: C.pine, display: "flex", alignItems: "center", gap: 4 }}>
                  <Check size={14} /> Enregistré
                </span>
              )}
              <button onClick={() => setScreen("preview")} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "6px 12px", background: "#fff", cursor: "pointer", color: C.charcoal }}>
                <Eye size={14} /> Voir mon site
              </button>
              <button onClick={logout} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: rgba(C.charcoal, 0.5), cursor: "pointer" }}>
                <LogOut size={14} /> Déconnexion
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", gap: 32 }}>
          {!isComplete && (
            <div style={{ background: "#fff", border: `1px solid ${rgba(C.wine, 0.2)}`, borderRadius: 10, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Complétez votre site ({doneCount}/{checklist.length})</p>
                <span style={{ fontSize: 11, color: rgba(C.charcoal, 0.45) }}>{Math.round((doneCount / checklist.length) * 100)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: rgba(C.charcoal, 0.08), overflow: "hidden", marginBottom: 12 }}>
                <div style={{ height: "100%", width: `${(doneCount / checklist.length) * 100}%`, background: C.wine, transition: "width .4s ease" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {checklist.filter((c) => !c.done).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: rgba(C.charcoal, 0.6) }}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", border: `1.5px solid ${rgba(C.charcoal, 0.25)}`, flexShrink: 0 }} />
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { value: site.reservations.length, label: "réservations reçues" },
              { value: site.menu.filter((m) => m.name.trim()).length, label: "plats au menu" },
              { value: site.gallery.length + site.menuPhotos.length, label: "photos ajoutées" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#fff", border: `1px solid ${rgba(C.charcoal, 0.08)}`, borderRadius: 10, padding: "14px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.wine }}>{s.value}</div>
                <div style={{ fontSize: 10.5, color: rgba(C.charcoal, 0.5), marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <SectionCard
            title={`Réservations (${site.reservations.length})`}
            action={
              <button onClick={() => { setShowManualRes(!showManualRes); setManError(""); }} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: C.wine, fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}>
                <Plus size={14} /> Ajouter (appel tél.)
              </button>
            }
          >
            {showManualRes && (
              <div style={{ background: rgba(C.wine, 0.04), border: `1px solid ${rgba(C.wine, 0.15)}`, borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 11, color: rgba(C.charcoal, 0.55) }}>Un client vient d'appeler pour réserver ? Ajoutez-le ici, la place est retirée immédiatement.</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input placeholder="Nom" value={manName} onChange={(e) => setManName(e.target.value)} style={{ flex: 1, minWidth: 100, fontSize: 13, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "7px 10px", outline: "none" }} />
                  <input placeholder="Téléphone" value={manPhone} onChange={(e) => setManPhone(e.target.value)} style={{ flex: 1, minWidth: 100, fontSize: 13, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "7px 10px", outline: "none" }} />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input type="date" value={manDate} onChange={(e) => setManDate(e.target.value)} style={{ flex: 1, minWidth: 120, fontSize: 13, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "7px 10px", outline: "none" }} />
                  <select value={manTime} onChange={(e) => setManTime(e.target.value)} style={{ flex: 1, minWidth: 100, fontSize: 13, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "7px 10px", outline: "none" }}>
                    <option value="">Heure</option>
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={manPeople} onChange={(e) => setManPeople(e.target.value)} style={{ width: 90, fontSize: 13, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "7px 10px", outline: "none" }}>
                    {[1, 2, 3, 4, 5, 6, "7+"].map((n) => <option key={n} value={n}>{n} pers.</option>)}
                  </select>
                </div>
                {manError && <p style={{ fontSize: 11, color: C.wine }}>{manError}</p>}
                <button
                  onClick={() => {
                    if (!manName || !manDate || !manTime) { setManError("Renseignez au moins le nom, la date et l'heure."); return; }
                    const already = seatsBookedFor(site, manDate, manTime);
                    const requested = manPeople === "7+" ? 7 : Number(manPeople);
                    if (site.totalSeats > 0 && already + requested > site.totalSeats) {
                      setManError(`Complet à ce créneau (${site.totalSeats - already} place(s) restante(s)).`);
                      return;
                    }
                    addManualReservation({ name: manName, phone: manPhone, date: manDate, time: manTime, people: manPeople });
                    setManName(""); setManPhone(""); setManDate(""); setManTime(""); setManPeople("2"); setManError(""); setShowManualRes(false);
                  }}
                  style={{ background: C.wine, color: C.cream, border: "none", borderRadius: 6, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Ajouter cette réservation
                </button>
              </div>
            )}

            {site.reservations.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 0", color: rgba(C.charcoal, 0.35) }}>
                <Inbox size={24} />
                <p style={{ fontSize: 12 }}>Aucune demande pour l'instant. Les réservations en ligne et celles ajoutées par téléphone apparaîtront ici.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {site.reservations.map((r) => (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: rgba(C.charcoal, 0.02), padding: 12, borderRadius: 8, border: `1px solid ${rgba(C.charcoal, 0.06)}`, fontSize: 13 }}>
                    <div>
                      <strong>{r.name}</strong> — {r.people} pers. le {r.date}{r.time ? ` à ${r.time}` : ""}
                      <span style={{ fontSize: 10, marginLeft: 6, padding: "1px 6px", borderRadius: 4, background: r.source === "manuel" ? rgba(C.pine, 0.12) : rgba(C.wine, 0.1), color: r.source === "manuel" ? C.pine : C.wine }}>
                        {r.source === "manuel" ? "📞 téléphone" : "🌐 en ligne"}
                      </span>
                      <div style={{ fontSize: 11, color: rgba(C.charcoal, 0.5) }}>{r.phone} · reçue le {r.receivedAt}</div>
                    </div>
                    <button onClick={() => deleteReservation(r.id)} style={{ background: "none", border: "none", color: rgba(C.charcoal, 0.3), cursor: "pointer", padding: 4 }} aria-label="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Partager mon site">
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`https://tableenligne.fr/${slugify(site.name)}`)}`}
                alt="QR code du site"
                style={{ width: 120, height: 120, borderRadius: 8, border: `1px solid ${rgba(C.charcoal, 0.1)}` }}
              />
              <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 12, color: rgba(C.charcoal, 0.6) }}>
                  Imprimez ce QR code sur vos tables ou votre vitrine — vos clients scannent et arrivent directement sur votre site.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, background: rgba(C.charcoal, 0.03), border: `1px solid ${rgba(C.charcoal, 0.08)}`, borderRadius: 6, padding: "8px 10px", color: rgba(C.charcoal, 0.6) }}>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>tableenligne.fr/{slugify(site.name)}</span>
                  <button onClick={copySiteLink} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: C.wine, fontWeight: 500, cursor: "pointer", fontSize: 12 }}>
                    <Copy size={13} /> {linkCopied ? "Copié !" : "Copier"}
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Identité">
            <Field label="Nom du restaurant" value={site.name} onChange={(v) => updateField("name", v)} />
            <Field label="Accroche" value={site.tagline} onChange={(v) => updateField("tagline", v)} />
            <Field label="Description" value={site.about} placeholder="Racontez votre restaurant en quelques phrases..." onChange={(v) => updateField("about", v)} textarea />
          </SectionCard>

          <SectionCard title="Coordonnées & réservation">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Adresse" value={site.address} onChange={(v) => updateField("address", v)} />
              <Field label="Téléphone" value={site.phone} onChange={(v) => updateField("phone", v)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Horaires" value={site.hours} onChange={(v) => updateField("hours", v)} />
              <Field label="Instagram (sans @)" value={site.instagram} onChange={(v) => updateField("instagram", v)} />
            </div>
            <Field label="Lien vers vos avis Google" placeholder="https://g.page/..." value={site.googleUrl} onChange={(v) => updateField("googleUrl", v)} />
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: rgba(C.charcoal, 0.7), display: "block", marginBottom: 4 }}>Capacité totale (nombre de places assises)</label>
              <input
                type="number"
                min="0"
                value={site.totalSeats}
                onChange={(e) => {
                  const v = e.target.value;
                  updateField("totalSeats", v === "" ? "" : Math.max(0, Number(v)));
                }}
                onBlur={(e) => {
                  if (e.target.value === "") updateField("totalSeats", 0);
                }}
                style={{ width: "100%", fontSize: 14, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "8px 12px", outline: "none", color: C.charcoal, background: "#fff" }}
              />
              <p style={{ fontSize: 11, color: rgba(C.charcoal, 0.45), marginTop: 4 }}>
                Laissez à 0 pour ne pas limiter les réservations en ligne.
              </p>
            </div>
          </SectionCard>

          <SectionCard title="Style du site">
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: rgba(C.charcoal, 0.7), display: "block", marginBottom: 8 }}>Police / style d'écriture</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => updateField("font", f.id)}
                    style={{
                      fontSize: 13, fontFamily: f.stack,
                      border: `1px solid ${site.font === f.id ? C.wine : rgba(C.charcoal, 0.15)}`,
                      background: site.font === f.id ? rgba(C.wine, 0.06) : "#fff",
                      borderRadius: 6, padding: "8px 14px", cursor: "pointer", color: C.charcoal,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: rgba(C.charcoal, 0.7), display: "block", marginBottom: 8 }}>Ambiance</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => updateField("palette", p.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, fontSize: 12,
                      border: `1px solid ${site.palette === p.id ? p.wine : rgba(C.charcoal, 0.15)}`,
                      background: site.palette === p.id ? rgba(C.wine, 0.06) : "#fff",
                      borderRadius: 6, padding: "6px 12px", cursor: "pointer", color: C.charcoal,
                    }}
                  >
                    <span style={{ width: 12, height: 12, borderRadius: "50%", display: "inline-block", background: p.bg }} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={`Photos (${site.gallery.length})`}
            action={
              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: C.wine, fontWeight: 500, cursor: "pointer" }}>
                <Plus size={14} /> {uploading ? "Chargement..." : "Ajouter des photos"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => addPhotos(e.target.files)}
                  disabled={uploading}
                />
              </label>
            }
          >
            {site.gallery.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "24px 0", color: rgba(C.charcoal, 0.35) }}>
                <ImageIcon size={28} />
                <p style={{ fontSize: 12 }}>Aucune photo pour l'instant. La première ajoutée devient la photo de couverture.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
                {site.gallery.map((img, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={img} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, border: `1px solid ${rgba(C.charcoal, 0.1)}` }} />
                    {i === 0 && (
                      <span style={{ position: "absolute", bottom: 4, left: 4, fontSize: 9, background: rgba(C.charcoal, 0.65), color: "#fff", padding: "2px 6px", borderRadius: 4 }}>
                        Couverture
                      </span>
                    )}
                    <button
                      onClick={() => removePhoto(i)}
                      style={{ position: "absolute", top: 4, right: 4, background: rgba(C.charcoal, 0.65), border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      aria-label="Supprimer la photo"
                    >
                      <X size={12} color="#fff" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title={`Photo(s) du menu (${site.menuPhotos.length})`}
            action={
              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: C.wine, fontWeight: 500, cursor: "pointer" }}>
                <Plus size={14} /> {uploading ? "Chargement..." : "Ajouter"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => addMenuPhotos(e.target.files)}
                  disabled={uploading}
                />
              </label>
            }
          >
            <p style={{ fontSize: 12, color: rgba(C.charcoal, 0.5) }}>
              Si tu préfères montrer une photo de ta vraie carte papier plutôt que (ou en plus de) la carte tapée ci-dessous — utile pour une ardoise qui change souvent, ou en attendant de tout retaper.
            </p>
            {site.menuPhotos.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "20px 0", color: rgba(C.charcoal, 0.35) }}>
                <ImageIcon size={24} />
                <p style={{ fontSize: 12 }}>Aucune photo de menu ajoutée.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
                {site.menuPhotos.map((img, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={img} alt="" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 8, border: `1px solid ${rgba(C.charcoal, 0.1)}` }} />
                    <button
                      onClick={() => removeMenuPhoto(i)}
                      style={{ position: "absolute", top: 4, right: 4, background: rgba(C.charcoal, 0.65), border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      aria-label="Supprimer"
                    >
                      <X size={12} color="#fff" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="La carte (tapée)">
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {CATEGORIES.map((cat) => {
                const items = site.menu.filter((m) => m.category === cat);
                return (
                  <div key={cat}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <h3 style={{ fontSize: 12, fontWeight: 600, color: rgba(C.charcoal, 0.6), textTransform: "uppercase", letterSpacing: 0.5 }}>{cat}</h3>
                      <button onClick={() => addMenuItem(cat)} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, color: C.wine, fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}>
                        <Plus size={12} /> Ajouter
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {items.map((item) => (
                        <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 6, background: rgba(C.charcoal, 0.02), padding: 10, borderRadius: 8, border: `1px solid ${rgba(C.charcoal, 0.06)}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                              onClick={() => toggleFeatured(item.id)}
                              title="Mettre en avant"
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}
                            >
                              <Star size={16} color={item.featured ? C.gold || "#B4894F" : rgba(C.charcoal, 0.25)} fill={item.featured ? "#B4894F" : "none"} />
                            </button>
                            <input
                              placeholder="Nom du plat"
                              value={item.name}
                              onChange={(e) => updateMenuItem(item.id, "name", e.target.value)}
                              style={{ flex: 1, fontSize: 13, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "6px 10px", outline: "none", color: C.charcoal, background: "#fff" }}
                            />
                            <input
                              placeholder="Prix"
                              value={item.price}
                              onChange={(e) => updateMenuItem(item.id, "price", e.target.value)}
                              style={{ width: 72, fontSize: 13, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "6px 10px", outline: "none", color: C.charcoal, background: "#fff" }}
                            />
                            <button onClick={() => removeMenuItem(item.id)} style={{ color: rgba(C.charcoal, 0.35), background: "none", border: "none", padding: 6, cursor: "pointer" }} aria-label="Supprimer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <input
                            placeholder="Description courte (optionnel)"
                            value={item.desc}
                            onChange={(e) => updateMenuItem(item.id, "desc", e.target.value)}
                            style={{ fontSize: 12, border: `1px solid ${rgba(C.charcoal, 0.12)}`, borderRadius: 6, padding: "6px 10px", outline: "none", color: rgba(C.charcoal, 0.7), background: "#fff" }}
                          />
                        </div>
                      ))}
                      {items.length === 0 && <p style={{ fontSize: 11, color: rgba(C.charcoal, 0.35) }}>Aucun plat dans cette catégorie.</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Avis clients"
            action={
              <button onClick={addTestimonial} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: C.wine, fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}>
                <Plus size={14} /> Ajouter un avis
              </button>
            }
          >
            {site.testimonials.length === 0 && <p style={{ fontSize: 12, color: rgba(C.charcoal, 0.4) }}>Aucun avis mis en avant pour l'instant.</p>}
            {site.testimonials.map((t) => (
              <div key={t.id} style={{ display: "flex", flexDirection: "column", gap: 8, background: rgba(C.charcoal, 0.02), padding: 12, borderRadius: 8, border: `1px solid ${rgba(C.charcoal, 0.06)}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    placeholder="Nom du client"
                    value={t.name}
                    onChange={(e) => updateTestimonial(t.id, "name", e.target.value)}
                    style={{ flex: 1, fontSize: 13, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "6px 10px", outline: "none", color: C.charcoal, background: "#fff" }}
                  />
                  <select
                    value={t.stars}
                    onChange={(e) => updateTestimonial(t.id, "stars", Number(e.target.value))}
                    style={{ fontSize: 13, border: `1px solid ${rgba(C.charcoal, 0.15)}`, borderRadius: 6, padding: "6px 8px", outline: "none", color: C.charcoal, background: "#fff" }}
                  >
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                  </select>
                  <button onClick={() => removeTestimonial(t.id)} style={{ color: rgba(C.charcoal, 0.35), background: "none", border: "none", padding: 6, cursor: "pointer" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  placeholder="Ce que dit le client..."
                  value={t.text}
                  onChange={(e) => updateTestimonial(t.id, "text", e.target.value)}
                  rows={2}
                  style={{ fontSize: 12, border: `1px solid ${rgba(C.charcoal, 0.12)}`, borderRadius: 6, padding: "8px 10px", outline: "none", color: rgba(C.charcoal, 0.7), background: "#fff", fontFamily: "inherit", resize: "vertical" }}
                />
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Abonnement">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>24€/mois — sans engagement</p>
                <p style={{ fontSize: 11, color: rgba(C.charcoal, 0.5) }}>Paiement sécurisé par carte bancaire, résiliable à tout moment.</p>
              </div>
              <a
                href={STRIPE_PAYMENT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 6, background: C.wine, color: C.cream, borderRadius: 6, padding: "10px 18px", fontSize: 13, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}
              >
                S'abonner
              </a>
            </div>
          </SectionCard>

          <p style={{ fontSize: 12, color: rgba(C.charcoal, 0.4), textAlign: "center" }}>
            Tout est enregistré automatiquement à chaque modification.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
