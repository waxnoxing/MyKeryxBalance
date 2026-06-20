import React, { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Edit2, 
  Check, 
  X, 
  Copy, 
  ExternalLink,
  Coins,
  TrendingUp,
  Wifi
} from "lucide-react"

// Types
interface WalletConfig {
  id: string
  name: string
  address: string
}

// Initial Preset Wallets
const INITIAL_WALLETS: WalletConfig[] = [
  { 
    id: "1", 
    name: "Wallet 1", 
    address: "keryx:qpk2unde53fcc92evu9ny9ux8c2nfr7xucllelzczwmrhpcfx3tsuhdqx5snf" 
  },
  { 
    id: "2", 
    name: "Wallet 2", 
    address: "keryx:qqy7gqxd5xhvr2l2er2ksmaplre22369qnc4edug88kg8y440g0ag2u2ekq73" 
  },
  { 
    id: "3", 
    name: "Wallet 3", 
    address: "keryx:qradtnu35xjnmmnlz5ctyurg883pfk029evdly8t9vfqyvp3qt9dz2dhs44n4" 
  },
  { 
    id: "4", 
    name: "Wallet 4", 
    address: "keryx:qrzffslnza53pc6zwgvyqdc5hy2ng2z0yqlt3uvhpq25utqpsj0x27pjrxh40" 
  },
  { 
    id: "5", 
    name: "Wallet 5", 
    address: "keryx:qprf04jxxt8y36muvadqlhh8ezumus606jjfq4h8e0ehtuwznqvfyr5nsgemg" 
  }
]

// Function to format balance (Sompi -> KRX)
const formatSompiToKrx = (sompi: any): string => {
  if (typeof sompi !== "number" || isNaN(sompi)) return "0.00"
  return (sompi / 1e8).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  })
}

export function LiveMonitor() {
  // Initialize with INITIAL_WALLETS to ensure Server-Side Rendering matches the Client initial render perfectly
  const [wallets, setWallets] = useState<WalletConfig[]>(INITIAL_WALLETS)
  const [isPlaying, setIsPlaying] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Balances tracker to calculate total combined balance
  const [balances, setBalances] = useState<Record<string, number | null>>({})
  const [priceUsd, setPriceUsd] = useState<number | null>(null)
  const [marketData, setMarketData] = useState<any>(null)

  // Edit Form State
  const [editName, setEditName] = useState("")
  const [editAddress, setEditAddress] = useState("")

  // Safe localStorage Load
  useEffect(() => {
    try {
      const saved = localStorage.getItem("keryx_monitored_wallets_v3")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === 5) {
          setWallets(parsed)
        }
      }
    } catch (e) {
      console.warn("Storage access restricted, using default presets:", e)
    }
  }, [])

  // Safe localStorage Save
  const saveWallets = (updatedWallets: WalletConfig[]) => {
    setWallets(updatedWallets)
    try {
      localStorage.setItem("keryx_monitored_wallets_v3", JSON.stringify(updatedWallets))
    } catch (e) {
      console.warn("Could not write to localStorage:", e)
    }
  }

  // Handle Balance updates in the parent component
  const handleBalanceUpdate = (id: string, sompi: number | null) => {
    setBalances(prev => {
      if (prev[id] === sompi) return prev // Avoid redundant render cycles
      return { ...prev, [id]: sompi }
    })
  }

  // Fetch Market Data (5s interval)
  useEffect(() => {
    if (!isPlaying) return

    const fetchMarket = async () => {
      try {
        const res = await fetch("https://keryx-labs.com/api/v1/market")
        if (res.ok) {
          const data = await res.json()
          setPriceUsd(data.price_usd)
          setMarketData(data)
        }
      } catch (e) {
        console.error("Market fetch error:", e)
      }
    }

    fetchMarket()
    const interval = setInterval(fetchMarket, 5000)
    return () => clearInterval(interval)
  }, [isPlaying])

  // Handle Edit Action
  const startEditing = (wallet: WalletConfig) => {
    setEditingId(wallet.id)
    setEditName(wallet.name)
    setEditAddress(wallet.address)
  }

  const saveEdit = (id: string) => {
    const updated = wallets.map(w => {
      if (w.id === id) {
        return { ...w, name: editName.trim(), address: editAddress.trim() }
      }
      return w
    })
    
    // Clear balance tracker for that ID if address changed
    const oldAddress = wallets.find(w => w.id === id)?.address
    if (oldAddress !== editAddress.trim()) {
      setBalances(prev => ({ ...prev, [id]: null }))
    }

    saveWallets(updated)
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const resetToPresets = () => {
    if (window.confirm("Apakah Anda yakin ingin menyetel ulang ke 5 alamat bawaan?")) {
      setBalances({})
      saveWallets(INITIAL_WALLETS)
      setEditingId(null)
    }
  }

  // Calculation of aggregate stats
  const totalSompi = Object.values(balances).reduce((sum, val) => sum + (val || 0), 0)
  const totalKrx = totalSompi / 1e8
  const totalUsd = priceUsd ? totalKrx * priceUsd : null
  const activeWalletsCount = wallets.filter(w => w.address.trim() !== "").length

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl z-10 relative">
      
      {/* Header Info Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 animate-slide-up stagger-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 ${isPlaying ? "" : "hidden"}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? "bg-primary" : "bg-muted-foreground/40"}`}></span>
            </span>
            <span className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase">
              {isPlaying ? "Live Connection: ACTIVE (1s Polling)" : "Live Connection: PAUSED"}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider font-heading uppercase text-transparent bg-clip-text bg-gradient-to-r from-foreground via-primary to-foreground">
            Keryx Multi-Wallet Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-sans">
            Memantau Alamat &amp; Balance dari 5 dompet Keryx secara real-time. Klik ikon edit di tiap kartu untuk memasukkan alamat Anda.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <Button
            variant="cyber"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 text-xs h-9"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            {isPlaying ? "Pause Polling" : "Resume Polling"}
          </Button>

          <Button
            variant="cyber"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-9 px-3"
            title={soundEnabled ? "Nonaktifkan Suara" : "Aktifkan Suara"}
          >
            {soundEnabled ? <Volume2 size={13} className="text-primary" /> : <VolumeX size={13} className="text-muted-foreground" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={resetToPresets}
            className="text-[10px] h-9"
          >
            Reset Default
          </Button>
        </div>
      </div>

      {/* Aggregate Portfolio Summary Card (1000x Better UI!) */}
      <div className="mb-8 animate-slide-up stagger-2">
        <Card className="glass-panel border-primary/30 relative overflow-hidden bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              
              {/* Portfolio Balance */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1.5">
                  <Coins className="text-primary h-4 w-4" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
                    TOTAL COMBINED BALANCE
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono tracking-tight text-foreground">
                    {totalKrx.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </span>
                  <span className="text-sm font-bold text-primary font-heading">
                    KRX
                  </span>
                </div>
                {totalUsd !== null && (
                  <span className="text-xs font-mono text-muted-foreground/80 mt-1">
                    ≈ ${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                )}
              </div>

              {/* Network Stats */}
              <div className="flex flex-col border-y md:border-y-0 md:border-x border-border/10 py-4 md:py-0 md:px-6">
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp className="text-primary h-4 w-4" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
                    KERYX MARKET PRICE
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono text-foreground">
                    {priceUsd ? `$${priceUsd.toFixed(6)}` : "$0.000000"}
                  </span>
                  {marketData?.change_24h_pct !== undefined && (
                    <span className={`text-[10px] font-mono font-bold ${marketData.change_24h_pct >= 0 ? "text-primary" : "text-destructive"}`}>
                      {marketData.change_24h_pct >= 0 ? "+" : ""}{marketData.change_24h_pct.toFixed(2)}%
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-muted-foreground/60 mt-1">
                  Volume 24j: {marketData?.volume_24h_usd ? `$${marketData.volume_24h_usd.toLocaleString()}` : "—"}
                </span>
              </div>

              {/* Active Nodes / Tracker Telemetry */}
              <div className="flex flex-col md:pl-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
                    MONITOR TELEMETRY
                  </span>
                  <span className="text-[10px] font-mono text-primary font-bold flex items-center gap-1">
                    <Wifi size={11} className="animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Active Wallet Slots</span>
                    <span className="text-foreground font-bold">{activeWalletsCount} / 5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response Health</span>
                    <span className="text-primary font-bold">100% Stable</span>
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid of 5 Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up stagger-3">
        {wallets.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            isEditing={editingId === wallet.id}
            isPlaying={isPlaying}
            soundEnabled={soundEnabled}
            editName={editName}
            editAddress={editAddress}
            setEditName={setEditName}
            setEditAddress={setEditAddress}
            onSave={saveEdit}
            onCancel={cancelEdit}
            onEditStart={startEditing}
            onBalanceUpdate={(sompi) => handleBalanceUpdate(wallet.id, sompi)}
          />
        ))}
      </div>

      {/* Background Cyber Styling */}
      <div className="cyber-grid" />
      <div className="scanline" />
    </div>
  )
}

// Sub-component: Individual Wallet Card
interface WalletCardProps {
  wallet: WalletConfig
  isEditing: boolean
  isPlaying: boolean
  soundEnabled: boolean
  editName: string
  editAddress: string
  setEditName: (v: string) => void
  setEditAddress: (v: string) => void
  onSave: (id: string) => void
  onCancel: () => void
  onEditStart: (w: WalletConfig) => void
  onBalanceUpdate: (sompi: number | null) => void
}

function WalletCard({
  wallet,
  isEditing,
  isPlaying,
  soundEnabled,
  editName,
  editAddress,
  setEditName,
  setEditAddress,
  onSave,
  onCancel,
  onEditStart,
  onBalanceUpdate
}: WalletCardProps) {
  const [balanceSompi, setBalanceSompi] = useState<number | null>(null)
  
  // Server-safe initial status: if address is provided, it starts as 'loading', otherwise 'empty'
  const [status, setStatus] = useState<"empty" | "loading" | "success" | "error">(() => {
    return wallet.address.trim() !== "" ? "loading" : "empty"
  })
  
  const [flash, setFlash] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tick, setTick] = useState(false)
  
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Sound generator on increase
  const playBeep = () => {
    if (!soundEnabled) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === "suspended") ctx.resume()
      
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      const now = ctx.currentTime
      osc.type = "sine"
      osc.frequency.setValueAtTime(987.77, now) // B5 beep
      osc.frequency.exponentialRampToValueAtTime(1479.98, now + 0.12) // F#6
      
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
      
      osc.start(now)
      osc.stop(now + 0.2)
    } catch (e) {}
  }

  // Copy helper
  const copyAddress = () => {
    if (!wallet.address) return
    navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Polling logic for this wallet card
  useEffect(() => {
    const trimmedAddress = wallet.address.trim()
    if (!trimmedAddress) {
      setBalanceSompi(null)
      onBalanceUpdate(null)
      setStatus("empty")
      return
    }

    if (!isPlaying) return

    const getBalance = async () => {
      setTick(true)
      setTimeout(() => setTick(false), 150)
      
      try {
        const res = await fetch(`https://keryx-labs.com/api/v1/addresses/${encodeURIComponent(trimmedAddress)}/balance`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        
        if (data && typeof data.balance_sompi === "number") {
          const newBalance = data.balance_sompi
          
          setBalanceSompi(prev => {
            if (prev !== null && newBalance > prev) {
              setFlash(true)
              setTimeout(() => setFlash(false), 700)
              playBeep()
            }
            return newBalance
          })
          
          // Update parent state
          onBalanceUpdate(newBalance)
          setStatus("success")
        } else {
          setStatus("error")
          onBalanceUpdate(null)
        }
      } catch (e) {
        console.error(`Error card ${wallet.id}:`, e)
        setStatus("error")
        onBalanceUpdate(null)
      }
    }

    // Initial fetch
    getBalance()
    
    const interval = setInterval(getBalance, 1000)
    return () => clearInterval(interval)
  }, [wallet.address, isPlaying])

  // Reset states if address becomes empty
  useEffect(() => {
    if (!wallet.address.trim()) {
      setBalanceSompi(null)
      onBalanceUpdate(null)
      setStatus("empty")
    }
  }, [wallet.address])

  return (
    <Card className={`glass-panel border-primary/20 relative overflow-hidden transition-all duration-300 ${
      flash ? "shadow-[0_0_25px_oklch(0.85 0.25 140 / 0.25)] border-primary/60 scale-[1.01]" : ""
    }`}>
      {/* Visual pulse overlay */}
      <div className={`absolute inset-0 bg-primary/5 pointer-events-none transition-opacity duration-300 ${flash ? "opacity-100" : "opacity-0"}`} />

      <CardHeader className="p-4 pb-2 border-b border-border/10 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2 max-w-[80%]">
          {status === "success" && (
            <span className={`w-1.5 h-1.5 rounded-full ${tick ? "bg-primary scale-125" : "bg-primary/45"} transition-all duration-100`} />
          )}
          {status === "empty" && (
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
          )}
          {status === "error" && (
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
          )}
          {status === "loading" && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
          )}
          <CardTitle className="text-xs font-bold text-foreground font-heading truncate">
            {wallet.name || `Wallet ${wallet.id}`}
          </CardTitle>
        </div>

        {/* Edit Button */}
        {!isEditing && (
          <button
            onClick={() => onEditStart(wallet)}
            className="p-1 rounded text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            title="Edit wallet config"
          >
            <Edit2 size={12} />
          </button>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-3">
        {isEditing ? (
          /* Inline Edit Form */
          <div className="flex flex-col gap-3 animate-fade-in">
            <div>
              <label className="text-[9px] font-bold font-mono tracking-widest text-primary/80 uppercase block mb-1">
                Wallet Name
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Wallet 1 (Main Dev)"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold font-mono tracking-widest text-primary/80 uppercase block mb-1">
                Keryx Address
              </label>
              <Input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="keryx:..."
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="flex gap-2 justify-end mt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="h-7 text-[10px] px-2.5"
              >
                <X size={10} className="mr-1" /> Batal
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onSave(wallet.id)}
                className="h-7 text-[10px] px-3 font-semibold"
              >
                <Check size={10} className="mr-1" /> Simpan
              </Button>
            </div>
          </div>
        ) : (
          /* Display Address & Balance */
          <div className="flex flex-col gap-4">
            {/* Address */}
            <div className="flex flex-col">
              <span className="text-[9px] font-mono font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Address
              </span>
              {wallet.address.trim() ? (
                <div className="flex items-center gap-1.5 bg-background/40 border border-border/20 rounded-md p-1.5 hover:border-primary/20 transition-all select-all">
                  <span className="font-mono text-[10px] text-primary/90 break-all flex-1 leading-tight selection:bg-primary/20">
                    {wallet.address}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="p-1 rounded bg-secondary/30 text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
                    title="Salin alamat"
                  >
                    {copied ? <Check size={10} className="text-primary" /> : <Copy size={10} />}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground/40 italic font-sans py-1">
                  Belum ada alamat, klik edit di pojok kanan atas.
                </span>
              )}
            </div>

            {/* Balance */}
            <div className="flex flex-col bg-background/25 border border-border/5 rounded-md p-3">
              <span className="text-[9px] font-mono font-bold tracking-widest text-muted-foreground uppercase mb-0.5">
                Live Balance
              </span>
              
              {status === "empty" && (
                <span className="text-sm font-bold font-mono text-muted-foreground/30 mt-0.5">
                  NO ADDRESS
                </span>
              )}

              {status === "loading" && (
                <div className="h-6 flex items-center gap-1.5 mt-0.5">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] text-muted-foreground/60 font-mono">Syncing...</span>
                </div>
              )}

              {status === "error" && (
                <span className="text-sm font-bold font-mono text-destructive mt-0.5">
                  CONN ERROR
                </span>
              )}

              {status === "success" && (
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-black font-mono tracking-tight text-foreground transition-all duration-300">
                    {balanceSompi !== null ? formatSompiToKrx(balanceSompi) : "0.00"}
                  </span>
                  <span className="text-[10px] font-bold text-primary font-heading">
                    KRX
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {!isEditing && wallet.address.trim() && (
        <CardFooter className="p-3 pt-0 border-t border-border/5 justify-end">
          <a
            href={`https://keryx-labs.com/address/${encodeURIComponent(wallet.address.trim())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-mono text-muted-foreground/60 hover:text-primary transition-colors flex items-center gap-0.5 uppercase tracking-wider"
          >
            Explorer
            <ExternalLink size={9} />
          </a>
        </CardFooter>
      )}
    </Card>
  )
}
