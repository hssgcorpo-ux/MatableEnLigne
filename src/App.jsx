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
