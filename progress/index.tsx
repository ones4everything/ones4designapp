import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { FilesetResolver, PoseLandmarker, FaceLandmarker, HandLandmarker } from "@mediapipe/tasks-vision";

// --- Global Types ---
declare global {
  interface Window {
    fabric: any;
  }
}

// --- Icons (SVG) ---
const IconCube = ({size = 20, className = ""}: {size?: number, className?: string}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.12 6.4-6.05-4.06a2 2 0 0 0-2.14 0L6.88 2.34a2 2 0 0 0-.88 1.66v8.2a2 2 0 0 0 .88 1.66l6.05 4.07a2 2 0 0 0 2.14 0l6.05-4.07a2 2 0 0 0 .88-1.66v-8.2a2 2 0 0 0-.88-1.66Z"/><path d="m10 2 2.39 1.6"/><path d="m10 17 5 5"/><path d="m12 4.6 10 7.4"/><path d="M4 7l8 5.4"/><path d="m12 12.4 8-5.4"/></svg>;
const IconMagic = ({size = 20, className = ""}: {size?: number, className?: string}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M7 3v4"/><path d="M3 7h4"/><path d="M3 5h4"/></svg>;
const IconCamera = ({className = ""}: {className?: string}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>;
const IconShoppingBag = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
const IconCheck = ({size = 24}: {size?: number}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconLoader = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconUpload = ({size = 24}: {size?: number}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
const IconType = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>;
const IconSettings = ({className = ""}: {className?: string}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconVRHeadset = ({className = ""}: {className?: string}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Z"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>;
const IconSun = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const IconMoon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

// --- Constants ---
const SHOPIFY_CONFIG = {
  domain: 'jfg9tu-fb.myshopify.com',
  accessToken: process.env.SHOPIFY_STOREFRONT_TOKEN || 'dd4d4dc146542ba7763305d71d1b3d38' 
};

const SHIRT_COLORS = [
  { name: 'Midnight Black', hex: '#1a1a1a' },
  { name: 'Classic White', hex: '#f5f5f5' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Forest Green', hex: '#14532d' },
  { name: 'Crimson Red', hex: '#991b1b' },
  { name: 'Heather Grey', hex: '#6b7280' },
  { name: 'Neon Pink', hex: '#ec4899' },
  { name: 'Electric Blue', hex: '#3b82f6' },
];

const DEFAULT_PRODUCT_TYPES = [
    'Heavyweight Cotton Tee',
    'Performance Hoodie',
    'Canvas Tote Bag',
    'Premium Eyewear'
];

const GLASSES_STYLES = {
    'Wayfarer': {
        label: 'Wayfarer',
        path: "M10,20 Q40,10 70,20 Q90,25 100,20 Q110,25 130,20 Q160,10 190,20 L190,50 Q160,70 130,50 L125,50 Q115,55 100,50 Q85,55 75,50 L70,50 Q40,70 10,50 Z",
        lens1: "M15,25 Q40,15 65,25 L65,45 Q40,65 15,45 Z",
        lens2: "M135,25 Q160,15 185,25 L185,45 Q160,65 135,45 Z"
    },
    'Aviator': {
        label: 'Aviator',
        path: "M10,20 Q50,10 95,20 L105,20 Q150,10 190,20 L190,40 Q180,75 140,70 Q110,65 105,30 L95,30 Q90,65 60,70 Q20,75 10,40 Z",
        lens1: "M15,25 Q50,15 90,25 Q85,60 50,65 Q20,60 15,25 Z",
        lens2: "M110,25 Q150,15 185,25 Q180,60 150,65 Q120,60 110,25 Z"
    },
    'Round': {
        label: 'Round',
        path: "M20,35 A25,25 0 1,0 70,35 A25,25 0 1,0 20,35 M85,35 L115,35 M130,35 A25,25 0 1,0 180,35 A25,25 0 1,0 130,35",
        lens1: "M25,35 A20,20 0 1,0 65,35 A20,20 0 1,0 25,35 Z",
        lens2: "M135,35 A20,20 0 1,0 175,35 A20,20 0 1,0 135,35 Z"
    }
};

const AI_PROMPTS = [
  "Cyberpunk glitch art",
  "Minimal geometric fox",
  "Vintage floral badge",
  "Neon abstract swirls",
  "Retro vaporwave sun"
];

const MOCK_PRICES = {
  basic: 29.99,
  premium: 49.99,
  neon: 149.99
};

// --- Styles (Cyber-Lux Theme) ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap');
  
  :root {
    --bg-deep: #030508;
    --bg-panel: rgba(10, 15, 20, 0.75);
    --border-neon: rgba(0, 243, 255, 0.3);
    --accent-cyan: #00f3ff;
    --accent-green: #00ff9d;
    --accent-pink: #ff0055;
    --text-primary: #e0e6ed;
    --text-secondary: #94a3b8;
    --glass-blur: blur(16px);
  }

  body {
    background-color: var(--bg-deep);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    background-image: 
        radial-gradient(circle at 50% 0%, rgba(0, 243, 255, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(0, 255, 157, 0.03) 0%, transparent 40%);
    overflow-x: hidden;
    margin: 0;
  }

  * { box-sizing: border-box; }

  /* Cyber-Lux Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg-deep); }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--accent-cyan); }

  /* Cyber Panel */
  .cyber-panel {
    background: var(--bg-panel);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--border-neon);
    border-radius: 16px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .cyber-panel::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
    opacity: 0.5;
  }

  /* Typography */
  .font-tech { font-family: 'Rajdhani', sans-serif; text-transform: uppercase; letter-spacing: 0.05em; }
  
  .text-glow { text-shadow: 0 0 10px rgba(0, 243, 255, 0.4); }
  .text-glow-green { text-shadow: 0 0 10px rgba(0, 255, 157, 0.4); }

  /* Buttons */
  .btn-cyber-primary {
    background: var(--accent-green);
    color: #000;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    border: none;
    padding: 14px 24px;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(0, 255, 157, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .btn-cyber-primary:hover {
    box-shadow: 0 0 25px rgba(0, 255, 157, 0.5);
    transform: translateY(-2px);
    filter: brightness(1.1);
  }
  
  .btn-cyber-primary:active {
    transform: scale(0.98);
  }

  .btn-cyber-secondary {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .btn-cyber-secondary:hover {
    border-color: var(--accent-cyan);
    box-shadow: 0 0 10px rgba(0, 243, 255, 0.15);
    color: var(--accent-cyan);
    background: rgba(0, 243, 255, 0.05);
  }

  .input-cyber {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #334155;
    color: white;
    padding: 12px;
    border-radius: 8px;
    width: 100%;
    outline: none;
    transition: all 0.3s;
    font-family: 'Inter', sans-serif;
  }
  .input-cyber:focus {
    border-color: var(--accent-cyan);
    box-shadow: 0 0 15px rgba(0, 243, 255, 0.1);
  }

  /* 3D Visuals */
  .shirt-container {
    perspective: 1500px;
    transition: transform 0.3s ease;
  }

  .shirt-base {
    filter: drop-shadow(0 20px 40px rgba(0,0,0,0.6));
    transition: all 0.3s ease;
  }

  /* Texture Overlay */
  .texture-overlay {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
    mix-blend-mode: overlay;
    pointer-events: none;
    z-index: 15;
    clip-path: inherit;
  }

  /* Product Shapes */
  .shirt-base {
    clip-path: polygon(20% 0%, 35% 5%, 65% 5%, 80% 0%, 100% 25%, 85% 35%, 85% 100%, 15% 100%, 15% 35%, 0% 25%);
    background-color: var(--shirt-color, #1a1a1a);
    box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
  }
  
  .product-hoodie .shirt-base {
    clip-path: polygon(20% 0%, 30% 10%, 70% 10%, 80% 0%, 100% 25%, 85% 35%, 85% 100%, 15% 100%, 15% 35%, 0% 25%);
  }
  
  .product-tote .shirt-base {
    clip-path: polygon(25% 25%, 40% 25%, 40% 0%, 60% 0%, 60% 25%, 75% 25%, 75% 100%, 25% 100%);
  }

  .print-area {
    position: absolute;
    top: 20%; left: 25%; width: 50%; height: 50%;
    z-index: 20;
    transition: all 0.3s ease;
  }
  
  .product-tote .print-area { top: 35%; height: 40%; }
  .product-hoodie .print-area { top: 22%; }
  
  /* Animations */
  @keyframes breathe {
    0%, 100% { transform: scale(1) translateY(0); }
    50% { transform: scale(1.02) translateY(-5px); }
  }
  
  .animate-breathe { animation: breathe 6s ease-in-out infinite; }

  /* Chips */
  .chip {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 6px 12px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-secondary);
    white-space: nowrap;
  }
  .chip:hover {
    background: rgba(0, 243, 255, 0.1);
    border-color: var(--accent-cyan);
    color: var(--accent-cyan);
  }

  .fit-btn {
    padding: 10px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .fit-btn.active {
    background: rgba(0, 243, 255, 0.1);
    color: var(--accent-cyan);
    border-color: var(--accent-cyan);
    box-shadow: 0 0 15px rgba(0, 243, 255, 0.1);
  }
  .fit-btn:hover:not(.active) {
    background: rgba(255, 255, 255, 0.05);
  }

  /* Range Slider */
  input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    background: transparent;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: var(--accent-cyan);
    cursor: pointer;
    margin-top: -6px;
    box-shadow: 0 0 10px var(--accent-cyan);
  }
  input[type=range]::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
`;

// --- Services ---

const shopifyRequest = async (query: string, variables: any = {}) => {
  // Graceful fallback for demo mode or invalid config
  if (!SHOPIFY_CONFIG.accessToken || SHOPIFY_CONFIG.accessToken.includes('process.env')) {
    return null;
  }
  try {
    const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/2023-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });
    // Check if response is ok
    if (!response.ok) return null;
    return response.json();
  } catch (e) {
    // Suppress error to allow fallback to work smoothly
    return null;
  }
};

const SHOPIFY_MUTATIONS = {
  createCheckout: `mutation checkoutCreate($input: CheckoutCreateInput!) {
    checkoutCreate(input: $input) {
      checkout {
        id
        webUrl
      }
    }
  }`,
  addLineItems: `mutation checkoutLineItemsAdd($checkoutId: ID!, $lineItems: [CheckoutLineItemInput!]!) {
    checkoutLineItemsAdd(checkoutId: $checkoutId, lineItems: $lineItems) {
      checkout {
        id
        webUrl
      }
    }
  }`
};

const SHOPIFY_QUERIES = {
    getProducts: `query getProducts { products(first: 20) { edges { node { id title handle variants(first: 1) { edges { node { id price { amount } } } } } } } }`
};

// --- Fabric.js Manager ---
class FabricManager {
    canvas: any;
    constructor(canvasId: string) {
        if (window.fabric) {
            this.canvas = new window.fabric.Canvas(canvasId, {
                width: 320,
                height: 400,
                backgroundColor: 'transparent',
                preserveObjectStacking: true
            });
            this.setupSnapping();
        }
    }

    setupSnapping() {
        if (!this.canvas) return;
        const SNAP_DIST = 10;
        this.canvas.on('object:moving', (e: any) => {
            const obj = e.target;
            const w = this.canvas.width;
            const h = this.canvas.height;
            
            // Snap to Center X
            if (Math.abs(obj.left + (obj.width * obj.scaleX)/2 - w/2) < SNAP_DIST) {
                obj.set({ left: w/2 - (obj.width * obj.scaleX)/2 });
            }
            // Snap to Center Y
            if (Math.abs(obj.top + (obj.height * obj.scaleY)/2 - h/2) < SNAP_DIST) {
                obj.set({ top: h/2 - (obj.height * obj.scaleY)/2 });
            }
        });
    }

    addText(text: string) {
        if (!this.canvas) return;
        const textObj = new window.fabric.Text(text, {
            left: 100,
            top: 100,
            fontFamily: 'Inter',
            fill: '#ffffff',
            fontSize: 24,
            fontWeight: 'bold',
            shadow: new window.fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 5, offsetX: 2, offsetY: 2 })
        });
        this.canvas.add(textObj);
        this.canvas.setActiveObject(textObj);
        this.canvas.renderAll();
    }

    addImage(url: string) {
        if (!this.canvas) return;
        window.fabric.Image.fromURL(url, (img: any) => {
            img.scaleToWidth(150);
            this.canvas.add(img);
            this.canvas.centerObject(img);
            this.canvas.setActiveObject(img);
            this.canvas.renderAll();
        }, { crossOrigin: 'anonymous' });
    }

    getDataURL() {
        // Safe check for canvas existence
        return this.canvas ? this.canvas.toDataURL({ format: 'png' }) : '';
    }

    destroy() {
        if (this.canvas) {
            this.canvas.dispose();
        }
    }
}


// --- Main App Component ---

const App = () => {
  const [shirtColor, setShirtColor] = useState(SHIRT_COLORS[0].hex);
  const [productType, setProductType] = useState(DEFAULT_PRODUCT_TYPES[0]);
  const [glassesStyle, setGlassesStyle] = useState<keyof typeof GLASSES_STYLES>('Wayfarer');
  const [designPrompt, setDesignPrompt] = useState('');
  const [customText, setCustomText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [vrMode, setVrMode] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark'); // Keeping hook but locked to dark for aesthetic
  
  // Fabric State
  const fabricRef = useRef<FabricManager | null>(null);
  const [compositeImage, setCompositeImage] = useState<string | null>(null);
  
  // Cart & Shopify State
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [shopifyProducts, setShopifyProducts] = useState<any[]>([]);
  const [shopifyError, setShopifyError] = useState(false);
  
  // 3D Logic Engine State
  const [fitType, setFitType] = useState<'slim' | 'regular' | 'oversized'>('regular');
  
  // Tracking State
  const [trackingActive, setTrackingActive] = useState(false);
  const [handTrackingActive, setHandTrackingActive] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState({ width: 0, left: 0, top: 0, rotation: 0 });

  // VR Interaction State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);

  // Initialize GenAI
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Init Fabric
  useEffect(() => {
      // Cleanup previous instance
      if (fabricRef.current) {
          fabricRef.current.destroy();
          fabricRef.current = null;
      }

      if (window.fabric && productType !== 'Premium Eyewear') {
          fabricRef.current = new FabricManager('design-canvas');
          // Removing 'after:render' listener to prevent recursion loop
      }

      return () => {
          if (fabricRef.current) {
              fabricRef.current.destroy();
              fabricRef.current = null;
          }
      };
  }, [productType]);

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
        const data = await shopifyRequest(SHOPIFY_QUERIES.getProducts);
        if (data && data.data && data.data.products) {
            const products = data.data.products.edges.map((e: any) => ({
                id: e.node.id,
                title: e.node.title,
                variantId: e.node.variants.edges[0]?.node.id,
                price: parseFloat(e.node.variants.edges[0]?.node.price.amount)
            }));
            if (products.length > 0) {
                setShopifyProducts(products);
                setProductType(products[0].title);
            } else setShopifyError(true);
        } else setShopifyError(true);
    };
    fetchProducts();
  }, []);

  const getProductPrice = () => {
      const p = shopifyProducts.find(p => p.title === productType);
      return p ? p.price : MOCK_PRICES.basic;
  };

  const getProductClass = () => {
    if (productType.includes('Hoodie')) return 'product-hoodie';
    if (productType.includes('Tote')) return 'product-tote';
    if (productType.includes('Eyewear')) return 'product-eyewear';
    return ''; // Default Tee
  };

  const displayProducts = shopifyProducts.length > 0 
    ? shopifyProducts 
    : DEFAULT_PRODUCT_TYPES.map(t => ({ title: t }));

  const handleGenerate = async () => {
    if (!designPrompt) return;
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Create a high-quality print design: ${designPrompt}. Isolated artwork on transparent background, cyber-aesthetic style.` }] },
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64 = `data:image/png;base64,${part.inlineData.data}`;
          fabricRef.current?.addImage(base64);
          break;
        }
      }
    } catch (error) { console.error(error); alert("Generation failed."); } 
    finally { setIsGenerating(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          if (event.target?.result) fabricRef.current?.addImage(event.target.result as string);
      };
      reader.readAsDataURL(file);
  };

  const addTextToCanvas = () => {
      if (customText) {
          fabricRef.current?.addText(customText);
          setCustomText('');
      }
  };

  // Setup Tracking
  const setupTracking = async () => {
    try {
      setModelLoading(true);
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
      );
      
      // Hand tracking for general interaction
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 2
      });
      setHandTrackingActive(true);

      // Face tracking for glasses
      if (productType === 'Premium Eyewear') {
          faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`, delegate: "GPU" },
            runningMode: "VIDEO",
            numFaces: 1
          });
      }

      setTrackingActive(true);
      setModelLoading(false);
      predictWebcam();
    } catch (error) {
      console.error(error);
      setModelLoading(false);
      setManualMode(true);
    }
  };

  const predictWebcam = () => {
    if (!videoRef.current || !vrMode) return;
    let startTimeMs = performance.now();
    
    // Face Tracking for Glasses
    if (productType === 'Premium Eyewear' && faceLandmarkerRef.current) {
        const result = faceLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
        if (result.faceLandmarks.length > 0) {
            const landmarks = result.faceLandmarks[0];
            const leftEye = landmarks[33]; // Outer left
            const rightEye = landmarks[263]; // Outer right
            
            // Calculate size and position
            const dx = rightEye.x - leftEye.x;
            const dy = rightEye.y - leftEye.y;
            const distance = Math.hypot(dx, dy);
            const centerX = (leftEye.x + rightEye.x) / 2;
            const centerY = (leftEye.y + rightEye.y) / 2;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            setOverlayStyle({
                width: distance * 3000, // Scale factor
                left: centerX * 100, // Percent
                top: centerY * 100,
                rotation: angle
            });
        }
    }

    // Hand Tracking Logic (simplified)
    if (handLandmarkerRef.current && fabricRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      const result = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
      
      if (result.landmarks && result.landmarks.length > 0) {
          const hand = result.landmarks[0];
          const indexTip = hand[8];
          const thumbTip = hand[4];
          const dist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
          
          if (dist < 0.05) {
              // Map to canvas coords (mirrored)
              const x = (1 - indexTip.x) * 320;
              const y = indexTip.y * 400;
              
              const activeObj = fabricRef.current.canvas.getActiveObject();
              if (activeObj) {
                  activeObj.set({ left: x, top: y, isMoving: true });
                  fabricRef.current.canvas.renderAll();
              }
          }
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (vrMode) {
      // Capture snapshot only once when entering VR to avoid recursion
      if(fabricRef.current) {
          setCompositeImage(fabricRef.current.getDataURL());
      }

      navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadeddata = () => setupTracking();
          }
        })
        .catch(() => setVrMode(false));
    }
    return () => {
       if (requestRef.current) cancelAnimationFrame(requestRef.current);
       stream?.getTracks().forEach(t => t.stop());
    };
  }, [vrMode, productType]);

  const addToCart = async () => {
      // Capture current state of canvas for the cart image on demand
      const finalImage = fabricRef.current ? fabricRef.current.getDataURL() : compositeImage;
      
      const currentProduct = shopifyProducts.find(p => p.title === productType);
      
      const item = {
          id: Date.now().toString(),
          title: productType,
          price: getProductPrice(),
          image: finalImage,
          variantId: currentProduct?.variantId
      };
      
      // Update local cart immediately (Optimistic UI)
      setCartItems(prev => [...prev, item]);
      setIsCartOpen(true);
      
      // Shopify Integration
      if (currentProduct?.variantId) {
          const lineItems = [{
              variantId: currentProduct.variantId,
              quantity: 1,
              // Note: We could add custom attributes here for the image URL if we uploaded it
              // customAttributes: [{ key: "Design", value: "Custom" }]
          }];

          try {
            if (!checkoutId) {
                // Create new checkout
                const res = await shopifyRequest(SHOPIFY_MUTATIONS.createCheckout, {
                    input: { lineItems }
                });
                if (res?.data?.checkoutCreate?.checkout) {
                    setCheckoutId(res.data.checkoutCreate.checkout.id);
                    setCheckoutUrl(res.data.checkoutCreate.checkout.webUrl);
                }
            } else {
                // Add to existing checkout
                const res = await shopifyRequest(SHOPIFY_MUTATIONS.addLineItems, {
                    checkoutId,
                    lineItems
                });
                if (res?.data?.checkoutLineItemsAdd?.checkout) {
                     setCheckoutUrl(res.data.checkoutLineItemsAdd.checkout.webUrl);
                }
            }
          } catch (e) {
            console.error("Failed to sync with Shopify", e);
          }
      } else {
          // Fallback simulation
          if(!checkoutId) {
             setCheckoutId('demo-id');
             setCheckoutUrl('https://shopify.com/checkout');
          }
      }
  };

  return (
    <>
      <style>{styles}</style>
      
      <div className="min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="h-16 border-b border-[var(--border-neon)] flex items-center justify-between px-6 bg-[var(--bg-deep)]/90 backdrop-blur sticky top-0 z-50 shadow-[0_0_20px_rgba(0,243,255,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-green)] rounded flex items-center justify-center font-bold text-black shadow-[0_0_15px_var(--accent-cyan)] font-tech text-lg">4</div>
            <span className="font-tech text-2xl tracking-widest text-white text-glow">ONES4<span className="text-[var(--text-secondary)] font-normal ml-1">DESIGN</span></span>
          </div>
          <div className="flex items-center gap-4">
             <button 
                className="text-[var(--text-primary)] relative p-2 focus:outline-none hover:text-[var(--accent-cyan)] transition-colors" 
                onClick={() => setIsCartOpen(true)}
                aria-label="Open Cart"
             >
                 <IconShoppingBag /> {cartItems.length > 0 && <span className="absolute 0 top-0 right-0 w-4 h-4 flex items-center justify-center text-[10px] bg-[var(--accent-green)] text-black rounded-full font-bold shadow-[0_0_10px_var(--accent-green)]">{cartItems.length}</span>}
             </button>
          </div>
        </nav>

        <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Design Tools Sidebar */}
          <div className="w-full md:w-96 bg-[var(--bg-deep)] border-r border-[var(--border-neon)] p-6 flex flex-col gap-6 overflow-y-auto z-10 shrink-0 shadow-2xl relative">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
             
             <h2 className="font-tech text-sm text-[var(--accent-cyan)] mb-2 flex items-center gap-2">
                 <IconSettings className="animate-spin-slow"/> System Config
             </h2>
             
             {/* 3D Logic Engine */}
             <div className="cyber-panel p-5">
                 <div className="flex items-center gap-2 mb-4 text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase">
                    <IconCube size={14} className="text-[var(--accent-green)]" /> {productType === 'Premium Eyewear' ? 'Frame Geometry' : 'Fit Simulation'}
                </div>
                {productType === 'Premium Eyewear' ? (
                     <div className="grid grid-cols-3 gap-2">
                         {Object.keys(GLASSES_STYLES).map(style => (
                             <button
                                 key={style}
                                 onClick={() => setGlassesStyle(style as any)}
                                 className={`fit-btn ${glassesStyle === style ? 'active' : ''}`}
                             >
                                 <span className="font-bold">{style}</span>
                             </button>
                         ))}
                     </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        <button 
                            onClick={() => setFitType('slim')}
                            className={`fit-btn ${fitType === 'slim' ? 'active' : ''}`}
                        >
                            <span className="font-bold">Slim</span>
                            <span className="text-[9px] opacity-70">Tactical</span>
                        </button>
                        <button 
                            onClick={() => setFitType('regular')}
                            className={`fit-btn ${fitType === 'regular' ? 'active' : ''}`}
                        >
                            <span className="font-bold">Regular</span>
                            <span className="text-[9px] opacity-70">Standard</span>
                        </button>
                        <button 
                            onClick={() => setFitType('oversized')}
                            className={`fit-btn ${fitType === 'oversized' ? 'active' : ''}`}
                        >
                            <span className="font-bold">Oversized</span>
                            <span className="text-[9px] opacity-70">Street</span>
                        </button>
                    </div>
                )}
             </div>

             {/* Product Selection */}
             <div className="cyber-panel p-5">
                 <label className="block text-xs font-bold text-[var(--text-secondary)] mb-3 uppercase tracking-widest">Base Asset</label>
                 <select 
                    className="input-cyber cursor-pointer" 
                    value={productType} 
                    onChange={e => setProductType(e.target.value)}
                 >
                     {displayProducts.map((p: any) => (
                         <option key={p.title} value={p.title}>{p.title}</option>
                     ))}
                 </select>
             </div>

             {/* Customization Tools */}
             {productType !== 'Premium Eyewear' && (
                 <>
                 <div className="cyber-panel p-5">
                     <label className="block text-xs font-bold text-[var(--text-secondary)] mb-3 uppercase tracking-widest">Modification Layer</label>
                     <div className="space-y-4">
                         <button onClick={() => fileInputRef.current?.click()} className="btn-cyber-secondary w-full text-xs py-3"><IconUpload size={16}/> Upload Texture</button>
                         <input ref={fileInputRef} type="file" hidden onChange={handleFileUpload} />
                         
                         <div className="flex gap-2">
                             <input className="input-cyber flex-1" placeholder="ENTER TEXT_DATA..." value={customText} onChange={e => setCustomText(e.target.value)} />
                             <button onClick={addTextToCanvas} className="btn-cyber-secondary px-3" title="Inject Text"><IconType/></button>
                         </div>
                     </div>
                 </div>
                 
                 <div className="cyber-panel p-5 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-1"><div className="w-2 h-2 rounded-full bg-[var(--accent-pink)] animate-pulse"></div></div>
                     <label className="block text-xs font-bold text-[var(--text-secondary)] mb-3 uppercase tracking-widest flex items-center gap-2">
                        <IconMagic size={14} className="text-[var(--accent-pink)]"/> AI Neural Fabricator
                     </label>
                     <textarea className="input-cyber mb-3 min-h-[80px]" rows={2} value={designPrompt} onChange={e => setDesignPrompt(e.target.value)} placeholder="Describe visual output..." />
                     <div className="flex flex-wrap gap-2 mb-4">
                        {AI_PROMPTS.slice(0, 4).map(prompt => (
                            <button key={prompt} onClick={() => setDesignPrompt(prompt)} className="chip">{prompt}</button>
                        ))}
                     </div>
                     <button onClick={handleGenerate} disabled={isGenerating} className="btn-cyber-secondary w-full text-xs py-3 border-[var(--accent-pink)] text-[var(--accent-pink)] hover:bg-[rgba(255,0,85,0.1)]">
                         {isGenerating ? <IconLoader/> : "INITIATE GENERATION SEQUENCE"}
                     </button>
                 </div>
                 </>
             )}
             
             {productType === 'Premium Eyewear' && (
                 <div className="cyber-panel p-5">
                     <label className="block text-xs font-bold text-[var(--text-secondary)] mb-3 uppercase tracking-widest">Material Finish</label>
                     <div className="grid grid-cols-6 gap-3">
                         {SHIRT_COLORS.map(c => (
                           <button
                             key={c.hex}
                             onClick={() => setShirtColor(c.hex)}
                             className={`w-8 h-8 rounded border transition-all ${shirtColor === c.hex ? 'border-[var(--accent-cyan)] shadow-[0_0_10px_var(--accent-cyan)] scale-110' : 'border-gray-700'}`}
                             style={{ backgroundColor: c.hex }}
                             title={c.name}
                           />
                         ))}
                     </div>
                 </div>
             )}

             <div className="mt-auto pt-6 border-t border-[var(--border-neon)]">
                 <div className="flex justify-between items-baseline mb-2">
                     <div className="text-3xl font-tech font-bold text-white">${getProductPrice().toFixed(2)}</div>
                     <div className="text-xs text-[var(--accent-green)] font-bold flex items-center gap-1 uppercase tracking-wider"><IconCheck size={12}/> System Ready</div>
                 </div>
                 <div className="text-xs text-[var(--text-secondary)] mb-5">Premium Grade • High Fidelity Print</div>
                 <button onClick={addToCart} className="btn-cyber-primary w-full">
                     ADD TO CART
                 </button>
             </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black">
             
             {/* Dynamic Background */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,243,255,0.1)_0%,_rgba(0,0,0,1)_70%)]"></div>
             <div className="absolute inset-0 opacity-20" style={{backgroundImage: `linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px)`, backgroundSize: '50px 50px'}}></div>

             <div className="relative z-10 flex flex-col items-center">
                 
                 {productType === 'Premium Eyewear' ? (
                     /* 3D Glasses Preview */
                     <div className="animate-breathe drop-shadow-[0_0_30px_rgba(0,243,255,0.2)]" style={{ transform: `rotateY(${rotation}deg)` }}>
                         <svg width="300" height="150" viewBox="0 0 200 100">
                             <g transform="translate(0, 10)">
                                 <path d={GLASSES_STYLES[glassesStyle].path} fill={shirtColor} stroke={shirtColor === '#1a1a1a' ? '#333' : '#fff'} strokeWidth="1" />
                                 <path d={GLASSES_STYLES[glassesStyle].lens1} fill="rgba(0,0,0,0.8)" />
                                 <path d={GLASSES_STYLES[glassesStyle].lens2} fill="rgba(0,0,0,0.8)" />
                                 {/* Cyber Glint */}
                                 <path d={GLASSES_STYLES[glassesStyle].lens1} fill="url(#glint)" opacity="0.4" />
                             </g>
                             <defs>
                                <linearGradient id="glint" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="transparent"/>
                                    <stop offset="50%" stopColor="rgba(0,243,255,0.8)"/>
                                    <stop offset="100%" stopColor="transparent"/>
                                </linearGradient>
                             </defs>
                         </svg>
                     </div>
                 ) : (
                     /* 3D Shirt Simulation */
                     <div className={`shirt-container animate-breathe ${getProductClass()} fit-${fitType}`} style={{'--shirt-color': shirtColor, transform: `rotateY(${rotation}deg)`} as any}>
                         <div className="shirt-base"></div>
                         <div className="texture-overlay"></div>
                         <div className="print-area">
                             <canvas id="design-canvas" width="320" height="400" className="w-full h-full"></canvas>
                         </div>
                     </div>
                 )}
                 
                 <div className="mt-16 w-72">
                     <input type="range" min="-45" max="45" value={rotation} onChange={e => setRotation(Number(e.target.value))} />
                 </div>
             </div>

             <button 
                 onClick={() => setVrMode(true)} 
                 className="absolute top-8 right-8 bg-black/50 backdrop-blur border border-[var(--accent-cyan)] text-[var(--accent-cyan)] px-6 py-3 rounded font-tech font-bold text-sm flex items-center gap-3 hover:bg-[var(--accent-cyan)] hover:text-black transition-all shadow-[0_0_20px_rgba(0,243,255,0.2)] group z-20"
             >
                 <IconVRHeadset className="animate-pulse" /> 
                 <span className="group-hover:inline">TRY OONJ [VR]</span>
             </button>
          </div>
        </main>
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
          <div className="fixed inset-0 z-[60] flex justify-end">
              <div className="absolute inset-0 bg-black/80 backdrop-blur" onClick={() => setIsCartOpen(false)}></div>
              <div className="relative w-full max-w-md bg-[var(--bg-deep)] h-full shadow-[0_0_50px_rgba(0,0,0,0.8)] border-l border-[var(--border-neon)] flex flex-col p-8 text-white">
                  <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
                      <h2 className="text-2xl font-tech font-bold flex items-center gap-2 text-[var(--accent-cyan)]"><IconShoppingBag/> CART_MANIFEST</h2>
                      <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/10 rounded"><IconX/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4">
                      {cartItems.map((item, i) => (
                          <div key={i} className="bg-[rgba(255,255,255,0.03)] p-4 rounded border border-gray-800 flex gap-4">
                              {item.image ? <img src={item.image} className="w-20 h-20 object-contain bg-gray-900 rounded border border-gray-700"/> : <div className="w-20 h-20 bg-gray-900 rounded flex items-center justify-center"><IconCube/></div>}
                              <div>
                                  <div className="font-bold text-lg">{item.title}</div>
                                  <div className="text-[var(--accent-green)] font-tech text-xl mt-1">${item.price.toFixed(2)}</div>
                              </div>
                          </div>
                      ))}
                  </div>
                  <div className="mt-4 pt-6 border-t border-[var(--border-neon)]">
                      <div className="flex justify-between mb-6 font-tech text-2xl">
                          <span>TOTAL</span>
                          <span className="text-white text-glow">${cartItems.reduce((acc, item) => acc + item.price, 0).toFixed(2)}</span>
                      </div>
                      <a href={checkoutUrl || '#'} className="btn-cyber-primary w-full text-center py-4 text-lg">PROCEED TO CHECKOUT</a>
                  </div>
              </div>
          </div>
      )}

      {/* VR Overlay */}
      {vrMode && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
              <div className="absolute top-8 left-8 z-50">
                  <h2 className="text-4xl font-tech font-bold text-white text-glow">TRY OONJ</h2>
                  <div className="text-[var(--accent-cyan)] text-sm mt-2 font-bold tracking-widest border border-[var(--accent-cyan)] px-3 py-1 inline-block bg-black/50 backdrop-blur">
                      {productType === 'Premium Eyewear' ? "SYSTEM: FACE_TRACKING_ACTIVE" : manualMode ? "PHYSICS: ENABLED" : "GESTURE: HAND_TRACKING_ACTIVE"}
                  </div>
              </div>
              <button onClick={() => setVrMode(false)} className="absolute top-8 right-8 z-50 p-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-full"><IconX/></button>
              
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gray-900">
                  <video ref={videoRef} autoPlay playsInline muted className="absolute w-full h-full object-cover scale-x-[-1] opacity-50" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,157,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.1)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none opacity-20"></div>
                  
                  {productType === 'Premium Eyewear' ? (
                       // Glasses AR Overlay
                       <div className="absolute z-10 pointer-events-none" style={{
                           width: `${overlayStyle.width}px`,
                           left: `${overlayStyle.left}%`,
                           top: `${overlayStyle.top}%`,
                           transform: `translate(-50%, -50%) rotate(${overlayStyle.rotation}deg)`,
                           filter: 'drop-shadow(0 0 20px rgba(0,243,255,0.6))'
                       }}>
                           <svg viewBox="0 0 200 80" className="w-full h-full">
                               <path d={GLASSES_STYLES[glassesStyle].path} fill={shirtColor} stroke={shirtColor==='#1a1a1a'?'#00f3ff':'white'} strokeWidth="2" opacity="0.95" />
                               <path d={GLASSES_STYLES[glassesStyle].lens1} fill="rgba(0,0,0,0.8)" />
                               <path d={GLASSES_STYLES[glassesStyle].lens2} fill="rgba(0,0,0,0.8)" />
                           </svg>
                       </div>
                  ) : (
                      // Shirt AR Overlay
                      compositeImage && (
                          <div className="absolute z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]" style={{
                              width: '320px', height: '400px',
                              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                              backgroundImage: `url(${compositeImage})`,
                              backgroundSize: 'contain',
                              backgroundRepeat: 'no-repeat'
                          }} />
                      )
                  )}
                  
                  {productType !== 'Premium Eyewear' && (
                      <div className="absolute bottom-12 flex gap-4">
                           <button onClick={() => setManualMode(!manualMode)} className={`btn-cyber-secondary ${manualMode ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10' : ''}`}>
                               <IconSettings/> {manualMode ? 'PHYSICS: ON' : 'PHYSICS: OFF'}
                           </button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);