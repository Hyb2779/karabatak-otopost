"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import AuthGate, { logoutPanel } from "@/components/auth-gate";

// Icons
const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const ChannelsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/>
    <path d="m19 9-5 5-4-4-3 3"/>
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 7v5l4 2"/>
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 16h5v5"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="M12 5v14"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    <path d="m15 5 4 4"/>
  </svg>
);


// Types
interface TargetChannel {
  id: number;
  chat_id: string;
  title: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

interface SourceChannel {
  id: number;
  source_chat_id: string;
  source_title: string;
  source_username: string;
  target_chat_id: string;
  target_title: string;
  target_channel_id: number | null;
  target_channel_title: string;
  target_channel_chat_id: string;
  append_link: string;
  append_link_text: string;
  daily_limit: number;
  remove_links: boolean;
  is_active: boolean;
  listen_type: 'direct' | 'link';
  trigger_keywords: string;
  keep_link_keywords: string;
  send_link_back: boolean;
  today_posts: number;
  total_posts: number;
  created_at: string;
}

interface RuleTarget {
  id: number;
  title: string;
  chat_id: string;
}

interface ForwardingRule {
  id: number;
  source_channel_id: number;
  name: string;
  match_keywords: string;
  target_channel_ids: number[];
  targets: RuleTarget[];
  append_link: string;
  append_link_text: string;
  remove_links: boolean;
  keep_link_keywords: string;
  send_link_back: boolean;
  priority: number;
  is_active: boolean;
}

interface PostHistory {
  id: number;
  source_link: string;
  target_message_id: string;
  created_at: string;
  has_media: boolean;
  status: string;
  source_title: string;
  target_title: string;
}

interface Stats {
  today_posts: number;
  total_posts: number;
  active_channels: number;
  bot_status: string;
  bot_enabled: boolean;
  last_post_time: string | null;
  weekly_stats: { date: string; posts: number; success: number }[];
}

const emptySourceChannel: Partial<SourceChannel> = {
  source_chat_id: '',
  source_title: '',
  target_channel_id: null,
  target_chat_id: '',
  target_title: '',
  append_link: '',
  append_link_text: '',
  daily_limit: 10,
  remove_links: true,
  is_active: true,
  listen_type: 'direct',
  trigger_keywords: '',
  keep_link_keywords: '',
  send_link_back: false,
};

const emptyTargetChannel: Partial<TargetChannel> = {
  chat_id: '',
  title: '',
  username: '',
  is_active: true,
};



function Dashboard() {
  const [activeTab, setActiveTab] = useState("targets");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data states
  const [targetChannels, setTargetChannels] = useState<TargetChannel[]>([]);
  const [sourceChannels, setSourceChannels] = useState<SourceChannel[]>([]);
  const [history, setHistory] = useState<PostHistory[]>([]);
  const [stats, setStats] = useState<Stats>({
    today_posts: 0,
    total_posts: 0,
    active_channels: 0,
    bot_status: 'offline',
    bot_enabled: true,
    last_post_time: null,
    weekly_stats: [],
  });

  // Dialog states
  const [editingSourceChannel, setEditingSourceChannel] = useState<Partial<SourceChannel> | null>(null);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [editingTargetChannel, setEditingTargetChannel] = useState<Partial<TargetChannel> | null>(null);
  const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false);

  // Dinleme kanalı dialog'undaki paylaşımlar (çoklu hedef + link bazlı yönlendirme)
  const [draftShares, setDraftShares] = useState<Partial<ForwardingRule>[]>([]);

  // Credentials (giris bilgileri) states
  const [credUsername, setCredUsername] = useState('');
  const [credCurrentPassword, setCredCurrentPassword] = useState('');
  const [credNewPassword, setCredNewPassword] = useState('');
  const [credNewPassword2, setCredNewPassword2] = useState('');
  const [credSaving, setCredSaving] = useState(false);
  const [credMessage, setCredMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form/popup açıkken otomatik yenilemeyi durdurmak için referans
  const dialogOpenRef = useRef(false);
  useEffect(() => {
    dialogOpenRef.current = isSourceDialogOpen || isTargetDialogOpen;
  }, [isSourceDialogOpen, isTargetDialogOpen]);

  const fetchData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const [targetRes, sourceRes, statsRes, postsRes] = await Promise.all([
        fetch('/api/target-channels'),
        fetch('/api/channels'),
        fetch('/api/stats'),
        fetch('/api/posts?limit=50'),
      ]);

      if (targetRes.ok) {
        const targetData = await targetRes.json();
        setTargetChannels(targetData);
      }

      if (sourceRes.ok) {
        const sourceData = await sourceRes.json();
        setSourceChannels(sourceData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setHistory(postsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // İlk yüklemede "Yükleniyor" göster, sonra sessizce arka planda güncelle
    fetchData(true);
    const interval = setInterval(() => {
      // Form/popup açıkken otomatik yenileme YAPMA (kullanıcıyı bölmesin)
      if (!dialogOpenRef.current) fetchData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Target Channel handlers
  const handleSaveTargetChannel = async () => {
    if (!editingTargetChannel) return;

    setSaving(true);
    try {
      const method = editingTargetChannel.id ? 'PUT' : 'POST';
      const response = await fetch('/api/target-channels', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTargetChannel),
      });

      if (response.ok) {
        await fetchData();
        setIsTargetDialogOpen(false);
        setEditingTargetChannel(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Bir hata olustu');
      }
    } catch (error) {
      console.error('Error saving target channel:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTargetChannel = async (id: number) => {
    if (!confirm('Bu hedef kanali silmek istediginizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/target-channels?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Silinemedi');
      }
    } catch (error) {
      console.error('Error deleting target channel:', error);
    }
  };

  // Source Channel handlers
  const handleSaveSourceChannel = async () => {
    if (!editingSourceChannel) return;

    if (!editingSourceChannel.source_chat_id) {
      alert('Lutfen Kaynak Kanal ID girin!');
      return;
    }

    // En az bir paylaşımın hedefi olmalı
    const validShares = draftShares.filter(s => (s.target_channel_ids || []).length > 0);
    if (validShares.length === 0) {
      alert('En az bir paylasim icin hedef kanal secin!');
      return;
    }

    setSaving(true);
    try {
      // Kanalı kaydet. Tekil alanlar (fallback) ilk paylaşımdan alınır.
      const first = validShares[0];
      const dataToSend = {
        id: editingSourceChannel.id,
        source_chat_id: editingSourceChannel.source_chat_id,
        source_title: editingSourceChannel.source_title,
        target_channel_id: first.target_channel_ids?.[0] ?? null,
        append_link: first.append_link || '',
        append_link_text: first.append_link_text || '',
        daily_limit: editingSourceChannel.daily_limit,
        remove_links: first.remove_links !== false,
        keep_link_keywords: first.keep_link_keywords || '',
        is_active: editingSourceChannel.is_active,
        listen_type: editingSourceChannel.listen_type,
        trigger_keywords: editingSourceChannel.trigger_keywords,
        send_link_back: editingSourceChannel.send_link_back,
      };

      const method = editingSourceChannel.id ? 'PUT' : 'POST';
      const response = await fetch('/api/channels', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Kaydedilemedi. Lutfen tekrar deneyin.');
        setSaving(false);
        return;
      }

      const saved = await response.json();
      const savedId = saved.id;

      // Paylaşımları (kuralları) senkronize et
      await syncShares(savedId, validShares);

      await fetchData();
      setIsSourceDialogOpen(false);
      setEditingSourceChannel(null);
      setDraftShares([]);
    } catch (error) {
      console.error('Error saving source channel:', error);
      alert('Bir hata olustu. Lutfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  // Paylaşımları kurallar tablosuyla senkronize et (sil + yeniden oluştur)
  const syncShares = async (sourceId: number, shares: Partial<ForwardingRule>[]) => {
    try {
      const existing: ForwardingRule[] = await fetch(`/api/rules?source_channel_id=${sourceId}`)
        .then(r => (r.ok ? r.json() : []));
      await Promise.all(existing.map(r => fetch(`/api/rules?id=${r.id}`, { method: 'DELETE' })));
    } catch (e) {
      console.error('Error clearing old shares:', e);
    }

    const n = shares.length;
    await Promise.all(shares.map((s, i) =>
      fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_channel_id: sourceId,
          name: (s.match_keywords && s.match_keywords.trim()) ? s.match_keywords.trim() : 'Genel',
          match_keywords: s.match_keywords || '',
          target_channel_ids: s.target_channel_ids || [],
          append_link: s.append_link || '',
          append_link_text: s.append_link_text || '',
          remove_links: s.remove_links !== false,
          keep_link_keywords: s.keep_link_keywords || '',
          send_link_back: false,
          priority: n - i, // üstteki paylaşım daha yüksek öncelik
        }),
      })
    ));
  };

  // Paylaşım (draft) yardımcıları
  const makeEmptyShare = (): Partial<ForwardingRule> => ({
    match_keywords: '',
    target_channel_ids: [],
    append_link: '',
    append_link_text: '',
    remove_links: true,
    keep_link_keywords: '',
  });

  const addShare = () => setDraftShares(prev => [...prev, makeEmptyShare()]);
  const removeShare = (index: number) => setDraftShares(prev => prev.filter((_, i) => i !== index));
  const updateShare = (index: number, patch: Partial<ForwardingRule>) =>
    setDraftShares(prev => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  const toggleShareTarget = (index: number, targetId: number) =>
    setDraftShares(prev => prev.map((s, i) => {
      if (i !== index) return s;
      const cur = s.target_channel_ids || [];
      return {
        ...s,
        target_channel_ids: cur.includes(targetId) ? cur.filter(t => t !== targetId) : [...cur, targetId],
      };
    }));

  // Dinleme kanalı dialog'unu aç (paylaşımları yükle)
  const openSourceDialog = async (channel?: SourceChannel) => {
    if (channel) {
      setEditingSourceChannel(channel);
      let shares: Partial<ForwardingRule>[] = [];
      try {
        const res = await fetch(`/api/rules?source_channel_id=${channel.id}`);
        if (res.ok) {
          const data: ForwardingRule[] = await res.json();
          shares = data.map(r => ({
            match_keywords: r.match_keywords || '',
            target_channel_ids: r.target_channel_ids || [],
            append_link: r.append_link || '',
            append_link_text: r.append_link_text || '',
            remove_links: r.remove_links,
            keep_link_keywords: r.keep_link_keywords || '',
          }));
        }
      } catch {
        // ignore
      }
      if (shares.length === 0) {
        // Eski tekil hedef ayarlarından bir paylaşım oluştur (geriye dönük uyum)
        shares = [{
          match_keywords: '',
          target_channel_ids: channel.target_channel_id ? [channel.target_channel_id] : [],
          append_link: channel.append_link || '',
          append_link_text: channel.append_link_text || '',
          remove_links: channel.remove_links,
          keep_link_keywords: channel.keep_link_keywords || '',
        }];
      }
      setDraftShares(shares);
    } else {
      setEditingSourceChannel({ ...emptySourceChannel });
      setDraftShares([makeEmptyShare()]);
    }
    setIsSourceDialogOpen(true);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeSourceForm = () => {
    setIsSourceDialogOpen(false);
    setEditingSourceChannel(null);
    setDraftShares([]);
  };

  const handleDeleteSourceChannel = async (id: number) => {
    if (!confirm('Bu dinleme kanalini silmek istediginizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/channels?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting source channel:', error);
    }
  };

  const handleToggleSourceChannel = async (channel: SourceChannel) => {
    try {
      const response = await fetch('/api/channels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: channel.id, is_active: !channel.is_active }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error toggling channel:', error);
    }
  };

  const handleToggleBot = async () => {
    try {
      const newValue = !stats.bot_enabled;
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'bot_enabled', value: newValue ? 'true' : 'false' }),
      });
      setStats(prev => ({ ...prev, bot_enabled: newValue }));
    } catch (error) {
      console.error('Error toggling bot:', error);
    }
  };

  // ============ CREDENTIALS ============
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/credentials');
        if (res.ok) {
          const data = await res.json();
          setCredUsername(data.username || '');
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredMessage(null);

    if (credNewPassword && credNewPassword !== credNewPassword2) {
      setCredMessage({ type: 'error', text: 'Yeni sifreler eslesmiyor' });
      return;
    }

    setCredSaving(true);
    try {
      const res = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: credCurrentPassword,
          new_username: credUsername,
          new_password: credNewPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCredMessage({ type: 'success', text: 'Giris bilgileri guncellendi. Guvenlik icin tekrar giris yapmaniz onerilir.' });
        setCredCurrentPassword('');
        setCredNewPassword('');
        setCredNewPassword2('');
      } else {
        setCredMessage({ type: 'error', text: data.error || 'Guncellenemedi' });
      }
    } catch {
      setCredMessage({ type: 'error', text: 'Sunucuya baglanilamadi' });
    } finally {
      setCredSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLastPostTime = () => {
    if (!stats.last_post_time) return '-';
    const date = new Date(stats.last_post_time);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTargetChannelName = (channel: SourceChannel) => {
    if (channel.target_channel_title) {
      return channel.target_channel_title;
    }
    if (channel.target_title) {
      return channel.target_title;
    }
    return channel.target_chat_id || 'Hedef Yok';
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <TelegramIcon />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Telegram Forwarder
              </h1>
              <p className="text-zinc-500 text-sm">Mesaj yonlendirme kontrol paneli</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Bot</span>
              <Switch
                checked={stats.bot_enabled}
                onCheckedChange={handleToggleBot}
              />
            </div>
            <Badge variant={stats.bot_status === "online" ? "success" : "destructive"}>
              <span className={`w-2 h-2 rounded-full mr-2 ${stats.bot_status === "online" ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
              {stats.bot_status === "online" ? "Cevrimici" : "Cevrimdisi"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={logoutPanel}
              className="border-zinc-700 text-zinc-400 hover:text-zinc-100"
              title="Cikis Yap"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="ml-2 hidden sm:inline">Cikis</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="text-zinc-500 text-sm mb-1">Bugun</div>
              <div className="text-3xl font-bold text-emerald-400">
                {stats.today_posts}
              </div>
              <div className="text-zinc-600 text-xs mt-1">post gonderildi</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="text-zinc-500 text-sm mb-1">Toplam</div>
              <div className="text-3xl font-bold text-zinc-100">{stats.total_posts}</div>
              <div className="text-zinc-600 text-xs mt-1">post</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="text-zinc-500 text-sm mb-1">Son Post</div>
              <div className="text-3xl font-bold text-zinc-100">{getLastPostTime()}</div>
              <div className="text-zinc-600 text-xs mt-1">saat</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="text-zinc-500 text-sm mb-1">Aktif Kanal</div>
              <div className="text-3xl font-bold text-teal-400">
                {stats.active_channels}
              </div>
              <div className="text-zinc-600 text-xs mt-1">dinleniyor</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full md:w-auto mb-6 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="targets" className="flex items-center gap-2 data-[state=active]:bg-zinc-800">
              <TargetIcon />
              <span className="hidden sm:inline">Hedef Kanallar</span>
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex items-center gap-2 data-[state=active]:bg-zinc-800">
              <ChannelsIcon />
              <span className="hidden sm:inline">Dinleme Kanallari</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-zinc-800">
              <SettingsIcon />
              <span className="hidden sm:inline">Ayarlar</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2 data-[state=active]:bg-zinc-800">
              <ChartIcon />
              <span className="hidden sm:inline">Istatistikler</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-zinc-800">
              <HistoryIcon />
              <span className="hidden sm:inline">Gecmis</span>
            </TabsTrigger>
          </TabsList>

          {/* Target Channels Tab */}
          <TabsContent value="targets">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-zinc-100">Hedef Kanallar</CardTitle>
                  <CardDescription>Mesajlarin gonderilecegi kanallar</CardDescription>
                </div>
                <Dialog open={isTargetDialogOpen} onOpenChange={(open) => {
                    if (open && !editingTargetChannel) {
                      setEditingTargetChannel({ ...emptyTargetChannel });
                    }
                    setIsTargetDialogOpen(open);
                    if (!open) {
                      setEditingTargetChannel(null);
                    }
                  }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingTargetChannel({ ...emptyTargetChannel });
                      setIsTargetDialogOpen(true);
                    }} className="bg-emerald-600 hover:bg-emerald-700">
                      <PlusIcon />
                      <span className="ml-2">Hedef Ekle</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-800">
                    <DialogHeader>
                      <DialogTitle className="text-zinc-100">
                        {editingTargetChannel?.id ? 'Hedef Kanali Duzenle' : 'Yeni Hedef Kanal Ekle'}
                      </DialogTitle>
                      <DialogDescription>
                        Mesajlarin gonderilecegi kanali ekleyin
                      </DialogDescription>
                    </DialogHeader>

                    {editingTargetChannel && (
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="target_chat_id">Kanal ID</Label>
                          <Input
                            id="target_chat_id"
                            placeholder="-100123456789 veya @kanaliniz"
                            value={editingTargetChannel.chat_id || ''}
                            onChange={(e) => setEditingTargetChannel(prev => ({ ...prev, chat_id: e.target.value }))}
                            className="bg-zinc-800 border-zinc-700"
                          />
                          <p className="text-xs text-zinc-500">
                            Kanalin ID&apos;si veya @kullaniciadi. Telegram&apos;da ID degisirse buradan guncelleyebilirsiniz.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="target_title">Kanal Ismi</Label>
                          <Input
                            id="target_title"
                            placeholder="Kanal Adi"
                            value={editingTargetChannel.title || ''}
                            onChange={(e) => setEditingTargetChannel(prev => ({ ...prev, title: e.target.value }))}
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="target_username">Kullanici Adi (Opsiyonel)</Label>
                          <Input
                            id="target_username"
                            placeholder="@kanaliniz"
                            value={editingTargetChannel.username || ''}
                            onChange={(e) => setEditingTargetChannel(prev => ({ ...prev, username: e.target.value }))}
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </div>
                      </div>
                    )}

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" className="border-zinc-700">Iptal</Button>
                      </DialogClose>
                      <Button onClick={handleSaveTargetChannel} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-zinc-500">Yukleniyor...</div>
                ) : targetChannels.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <p>Henuz hedef kanal eklenmedi.</p>
                    <p className="text-xs mt-2">Once hedef kanallarinizi ekleyin, sonra dinleme kanallari olusturun.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800">
                          <TableHead className="text-zinc-400">Kanal Ismi</TableHead>
                          <TableHead className="text-zinc-400">Kanal ID</TableHead>
                          <TableHead className="text-zinc-400">Kullanici Adi</TableHead>
                          <TableHead className="text-zinc-400 text-right">Islemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {targetChannels.map((channel) => (
                          <TableRow key={channel.id} className="border-zinc-800">
                            <TableCell className="font-medium text-zinc-200">
                              {channel.title}
                            </TableCell>
                            <TableCell className="font-mono text-zinc-400 text-sm">
                              {channel.chat_id}
                            </TableCell>
                            <TableCell className="text-zinc-400">
                              {channel.username || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingTargetChannel(channel);
                                    setIsTargetDialogOpen(true);
                                  }}
                                  className="text-zinc-400 hover:text-zinc-100"
                                >
                                  <EditIcon />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTargetChannel(channel.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <TrashIcon />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Source Channels Tab */}
          <TabsContent value="sources">
            {isSourceDialogOpen ? (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-zinc-100">
                    {editingSourceChannel?.id ? 'Dinleme Kanalini Duzenle' : 'Yeni Dinleme Kanali Ekle'}
                  </CardTitle>
                  <CardDescription>
                    Kaynak, hedefler ve paylasim ayarlarini tek yerden yonetin
                  </CardDescription>
                </div>
                <Button variant="outline" className="border-zinc-700" onClick={closeSourceForm}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5" />
                    <path d="m12 19-7-7 7-7" />
                  </svg>
                  <span className="ml-2">Geri</span>
                </Button>
              </CardHeader>
              <CardContent>
                    {editingSourceChannel && (
                      <div className="grid gap-5 py-4">
                        {/* Kaynak Bilgileri */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="source_chat_id">Kaynak Kanal ID</Label>
                            <Input
                              id="source_chat_id"
                              placeholder="-100123456789"
                              value={editingSourceChannel.source_chat_id || ''}
                              onChange={(e) => setEditingSourceChannel(prev => ({ ...prev, source_chat_id: e.target.value }))}
                              className="bg-zinc-800 border-zinc-700"
                            />
                            <p className="text-xs text-zinc-500">
                              Dinlenecek kanalin ID&apos;si. Grup ID&apos;si degisirse buradan guncelleyebilirsiniz.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="source_title">Kaynak Ismi</Label>
                            <Input
                              id="source_title"
                              placeholder="Kaynak Kanal"
                              value={editingSourceChannel.source_title || ''}
                              onChange={(e) => setEditingSourceChannel(prev => ({ ...prev, source_title: e.target.value }))}
                              className="bg-zinc-800 border-zinc-700"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="listen_type">Dinleme Turu</Label>
                            <Select
                              value={editingSourceChannel.listen_type || 'direct'}
                              onValueChange={(value) => setEditingSourceChannel(prev => ({ ...prev, listen_type: value as 'direct' | 'link' }))}
                            >
                              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="direct">Normal (Direkt Mesajlar)</SelectItem>
                                <SelectItem value="link">Link (Mesaj Baglantilari)</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-zinc-500">
                              {editingSourceChannel.listen_type === 'link'
                                ? 'Sadece telegram mesaj linklerini isler'
                                : 'Tum mesajlari direkt iletir'}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="daily_limit">Gunluk Limit</Label>
                            <Input
                              id="daily_limit"
                              type="number"
                              min="1"
                              max="1000"
                              value={editingSourceChannel.daily_limit || 10}
                              onChange={(e) => setEditingSourceChannel(prev => ({ ...prev, daily_limit: parseInt(e.target.value) || 10 }))}
                              className="bg-zinc-800 border-zinc-700"
                            />
                            <p className="text-xs text-zinc-500">Gunde max post sayisi</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="trigger_keywords">Tetikleyici Kelimeler (Genel Filtre)</Label>
                          <Textarea
                            id="trigger_keywords"
                            placeholder="kazanc, bonus, firsat (virgul ile ayirin)"
                            value={editingSourceChannel.trigger_keywords || ''}
                            onChange={(e) => setEditingSourceChannel(prev => ({ ...prev, trigger_keywords: e.target.value }))}
                            className="bg-zinc-800 border-zinc-700"
                          />
                          <p className="text-xs text-zinc-500">
                            Mesajda bu kelimelerden biri yoksa HIC islenmez. Bos birakirsaniz tum mesajlar islenir.
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                          <div>
                            <Label>Link Geri Gonder</Label>
                            <p className="text-xs text-zinc-500">Paylasim sonrasi hedef link(ler)ini kaynaga tek mesajda geri at</p>
                          </div>
                          <Switch
                            checked={editingSourceChannel.send_link_back === true}
                            onCheckedChange={(checked) => setEditingSourceChannel(prev => ({ ...prev, send_link_back: checked }))}
                          />
                        </div>

                        {/* Paylaşımlar */}
                        <div className="border-t border-zinc-800 pt-4">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-zinc-100">Paylasimlar (Hedefler)</h4>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-zinc-700"
                              onClick={addShare}
                            >
                              <PlusIcon />
                              <span className="ml-1">Paylasim Ekle</span>
                            </Button>
                          </div>
                          <p className="text-xs text-zinc-500 mb-3">
                            Ayni icerigi birden fazla gruba gondermek icin tek paylasimda birden fazla hedef secin.
                            Farkli linkler/mesajlar icin ayri paylasimlar ekleyip her birine tetikleyici kelime verin
                            (orn. linkte &quot;bonus&quot; varsa A grubuna, &quot;freespin&quot; varsa B grubuna).
                          </p>

                          <div className="space-y-4">
                            {draftShares.map((share, idx) => (
                              <div key={idx} className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-200">
                                    <span className="w-6 h-6 rounded-md bg-zinc-700 text-xs flex items-center justify-center font-mono">{idx + 1}</span>
                                    Paylasim {idx + 1}
                                  </span>
                                  {draftShares.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-400 hover:text-red-300"
                                      onClick={() => removeShare(idx)}
                                    >
                                      <TrashIcon />
                                    </Button>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label>Tetikleyici Kelime (opsiyonel)</Label>
                                  <Input
                                    placeholder="orn. bonus, freespin — bos = tum icerikler"
                                    value={share.match_keywords || ''}
                                    onChange={(e) => updateShare(idx, { match_keywords: e.target.value })}
                                    className="bg-zinc-800 border-zinc-700"
                                  />
                                  <p className="text-xs text-zinc-500">
                                    {editingSourceChannel.listen_type === 'link'
                                      ? 'Gelen LINK bu kelimeyi iceriyorsa bu paylasim uygulanir. '
                                      : 'Gelen MESAJ bu kelimeyi iceriyorsa bu paylasim uygulanir. '}
                                    Bos = her icerik.
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <Label>Hedef Kanallar <span className="text-red-400">*</span></Label>
                                  <div className="grid sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 rounded-lg border border-zinc-800 bg-zinc-950/40">
                                    {targetChannels.map((tc) => {
                                      const selected = (share.target_channel_ids || []).includes(tc.id);
                                      return (
                                        <button
                                          type="button"
                                          key={tc.id}
                                          onClick={() => toggleShareTarget(idx, tc.id)}
                                          className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors ${selected ? 'border-emerald-600 bg-emerald-600/15' : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600'}`}
                                        >
                                          <span className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'}`}>
                                            {selected && (
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                              </svg>
                                            )}
                                          </span>
                                          <span className="min-w-0">
                                            <span className="block text-sm text-zinc-200 truncate">{tc.title}</span>
                                            <span className="block text-xs text-zinc-500 font-mono truncate">{tc.chat_id}</span>
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label>Eklenecek Link</Label>
                                    <Input
                                      placeholder="https://t.me/kanaliniz"
                                      value={share.append_link || ''}
                                      onChange={(e) => updateShare(idx, { append_link: e.target.value })}
                                      className="bg-zinc-800 border-zinc-700"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Link Metni (Opsiyonel)</Label>
                                    <Input
                                      placeholder="Kanalimiza katil"
                                      value={share.append_link_text || ''}
                                      onChange={(e) => updateShare(idx, { append_link_text: e.target.value })}
                                      className="bg-zinc-800 border-zinc-700"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                                  <div>
                                    <Label>Linkleri Kaldir</Label>
                                    <p className="text-xs text-zinc-500">URL iceren satirlari temizle</p>
                                  </div>
                                  <Switch
                                    checked={share.remove_links !== false}
                                    onCheckedChange={(checked) => updateShare(idx, { remove_links: checked })}
                                  />
                                </div>

                                {share.remove_links !== false && (
                                  <div className="space-y-2 p-3 rounded-lg border border-emerald-900/40 bg-emerald-950/20">
                                    <Label className="text-emerald-300">Silinmeyecek Link Kelimeleri (Istisna)</Label>
                                    <Input
                                      placeholder="bonus, kampanya, davet"
                                      value={share.keep_link_keywords || ''}
                                      onChange={(e) => updateShare(idx, { keep_link_keywords: e.target.value })}
                                      className="bg-zinc-800 border-zinc-700"
                                    />
                                    <p className="text-xs text-zinc-500">
                                      Link bu kelimelerden birini iceriyorsa o link <span className="text-emerald-400">silinmez</span>. Bos = tum linkler silinir.
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6 border-t border-zinc-800 pt-5">
                      <Button variant="outline" className="border-zinc-700" onClick={closeSourceForm}>Iptal</Button>
                      <Button onClick={handleSaveSourceChannel} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                      </Button>
                    </div>
              </CardContent>
            </Card>
            ) : (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-zinc-100">Dinleme Kanallari</CardTitle>
                  <CardDescription>Mesajlarin alinacagi kaynaklar</CardDescription>
                </div>
                <Button
                  onClick={() => openSourceDialog()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={targetChannels.length === 0}
                >
                  <PlusIcon />
                  <span className="ml-2">Dinleme Ekle</span>
                </Button>
              </CardHeader>
              <CardContent>
                {targetChannels.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <p>Once hedef kanal eklemeniz gerekiyor.</p>
                    <Button
                      variant="outline"
                      className="mt-4 border-zinc-700"
                      onClick={() => setActiveTab('targets')}
                    >
                      Hedef Kanallara Git
                    </Button>
                  </div>
                ) : loading ? (
                  <div className="text-center py-8 text-zinc-500">Yukleniyor...</div>
                ) : sourceChannels.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    Henuz dinleme kanali eklenmedi.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800">
                          <TableHead className="text-zinc-400">Kaynak</TableHead>
                          <TableHead className="text-zinc-400">Hedef</TableHead>
                          <TableHead className="text-zinc-400">Tur</TableHead>
                          <TableHead className="text-zinc-400">Limit</TableHead>
                          <TableHead className="text-zinc-400">Bugun</TableHead>
                          <TableHead className="text-zinc-400">Durum</TableHead>
                          <TableHead className="text-zinc-400 text-right">Islemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sourceChannels.map((channel) => (
                          <TableRow key={channel.id} className="border-zinc-800">
                            <TableCell>
                              <div>
                                <div className="font-medium text-zinc-200">
                                  {channel.source_title || 'Kanal'}
                                </div>
                                <div className="text-xs text-zinc-500 font-mono">
                                  {channel.source_chat_id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-zinc-200">
                                  {getTargetChannelName(channel)}
                                </div>
                                <div className="text-xs text-zinc-500 font-mono">
                                  {channel.target_channel_chat_id || channel.target_chat_id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={channel.listen_type === 'link' ? 'secondary' : 'outline'}>
                                {channel.listen_type === 'link' ? 'Link' : 'Normal'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-zinc-300">
                              {channel.daily_limit}
                            </TableCell>
                            <TableCell>
                              <span className="text-emerald-400">{channel.today_posts || 0}</span>
                              <span className="text-zinc-500">/{channel.daily_limit}</span>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={channel.is_active}
                                onCheckedChange={() => handleToggleSourceChannel(channel)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openSourceDialog(channel)}
                                  className="text-zinc-400 hover:text-zinc-100"
                                >
                                  <EditIcon />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSourceChannel(channel.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <TrashIcon />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Genel Ayarlar</CardTitle>
                  <CardDescription>Bot yapilandirmasi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                    <div>
                      <Label className="text-zinc-200">Bot Durumu</Label>
                      <p className="text-xs text-zinc-500 mt-1">Botu aktif/pasif yap</p>
                    </div>
                    <Switch
                      checked={stats.bot_enabled}
                      onCheckedChange={handleToggleBot}
                    />
                  </div>

                  <div className="p-4 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-zinc-200">Bot Durumu</Label>
                      <Badge variant={stats.bot_status === "online" ? "success" : "destructive"}>
                        {stats.bot_status === "online" ? "Cevrimici" : "Cevrimdisi"}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Bot&apos;un Heroku&apos;da calisma durumu
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Hakkinda</CardTitle>
                  <CardDescription>Sistem bilgileri</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-zinc-800/50 rounded-lg">
                    <div className="text-sm text-zinc-400 mb-1">Versiyon</div>
                    <div className="text-zinc-200">1.1.0</div>
                  </div>
                  <div className="p-4 bg-zinc-800/50 rounded-lg">
                    <div className="text-sm text-zinc-400 mb-1">Bot</div>
                    <div className="text-zinc-200">Python Telethon @ Heroku</div>
                  </div>
                  <div className="p-4 bg-zinc-800/50 rounded-lg">
                    <div className="text-sm text-zinc-400 mb-1">Dashboard</div>
                    <div className="text-zinc-200">Next.js @ Netlify</div>
                  </div>
                  <div className="p-4 bg-zinc-800/50 rounded-lg">
                    <div className="text-sm text-zinc-400 mb-1">Veritabani</div>
                    <div className="text-zinc-200">PostgreSQL @ Neon.tech</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Giris Bilgileri */}
            <Card className="bg-zinc-900/50 border-zinc-800 mt-6">
              <CardHeader>
                <CardTitle className="text-zinc-100">Giris Bilgileri</CardTitle>
                <CardDescription>Panel kullanici adi ve sifresini degistirin</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateCredentials} className="space-y-5 max-w-xl">
                  <div className="space-y-2">
                    <Label htmlFor="cred_username">Kullanici Adi</Label>
                    <Input
                      id="cred_username"
                      value={credUsername}
                      onChange={(e) => setCredUsername(e.target.value)}
                      placeholder="Kullanici adi"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cred_current">Mevcut Sifre <span className="text-red-400">*</span></Label>
                    <Input
                      id="cred_current"
                      type="password"
                      value={credCurrentPassword}
                      onChange={(e) => setCredCurrentPassword(e.target.value)}
                      placeholder="Dogrulama icin mevcut sifreniz"
                      className="bg-zinc-800 border-zinc-700"
                      autoComplete="current-password"
                    />
                    <p className="text-xs text-zinc-500">Degisiklik yapmak icin mevcut sifrenizi girmelisiniz.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cred_new">Yeni Sifre</Label>
                      <Input
                        id="cred_new"
                        type="password"
                        value={credNewPassword}
                        onChange={(e) => setCredNewPassword(e.target.value)}
                        placeholder="Bos = degismez"
                        className="bg-zinc-800 border-zinc-700"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cred_new2">Yeni Sifre (Tekrar)</Label>
                      <Input
                        id="cred_new2"
                        type="password"
                        value={credNewPassword2}
                        onChange={(e) => setCredNewPassword2(e.target.value)}
                        placeholder="Yeni sifreyi tekrar girin"
                        className="bg-zinc-800 border-zinc-700"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {credMessage && (
                    <div className={`rounded-lg px-4 py-2.5 text-sm border ${credMessage.type === 'success' ? 'border-emerald-900/50 bg-emerald-950/40 text-emerald-300' : 'border-red-900/50 bg-red-950/40 text-red-300'}`}>
                      {credMessage.text}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={credSaving} className="bg-emerald-600 hover:bg-emerald-700">
                      {credSaving ? 'Kaydediliyor...' : 'Bilgileri Guncelle'}
                    </Button>
                    {credMessage?.type === 'success' && (
                      <Button type="button" variant="outline" className="border-zinc-700" onClick={logoutPanel}>
                        Tekrar Giris Yap
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Istatistikler</CardTitle>
                <CardDescription>Bot performans metrikleri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
                    <div className="text-zinc-400 text-sm mb-2">Bu Hafta</div>
                    <div className="text-4xl font-bold text-emerald-400">
                      {stats.weekly_stats.reduce((acc, s) => acc + Number(s.posts || 0), 0)}
                    </div>
                    <div className="text-zinc-500 text-sm mt-1">post gonderildi</div>
                  </div>
                  <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
                    <div className="text-zinc-400 text-sm mb-2">Toplam</div>
                    <div className="text-4xl font-bold text-teal-400">{stats.total_posts}</div>
                    <div className="text-zinc-500 text-sm mt-1">post gonderildi</div>
                  </div>
                  <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
                    <div className="text-zinc-400 text-sm mb-2">Aktif Kanallar</div>
                    <div className="text-4xl font-bold text-cyan-400">{stats.active_channels}</div>
                    <div className="text-zinc-500 text-sm mt-1">kanal dinleniyor</div>
                  </div>
                </div>

                {stats.weekly_stats.length > 0 && (
                  <div className="mt-8 p-6 rounded-xl bg-zinc-800/30 border border-zinc-800">
                    <h3 className="text-lg font-semibold mb-4 text-zinc-200">Son 7 Gun</h3>
                    <div className="flex items-end justify-between h-32 gap-2">
                      {stats.weekly_stats.map((stat, i) => {
                        const maxPosts = Math.max(...stats.weekly_stats.map(s => Number(s.posts) || 1));
                        const height = ((Number(stat.posts) || 0) / maxPosts) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div
                              className="w-full bg-gradient-to-t from-emerald-600 to-teal-500 rounded-t-lg transition-all duration-300 hover:opacity-80"
                              style={{ height: `${Math.max(height, 5)}%` }}
                            />
                            <span className="text-xs text-zinc-500">
                              {new Date(stat.date).toLocaleDateString('tr-TR', { weekday: 'short' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-zinc-100">Post Gecmisi</CardTitle>
                  <CardDescription>Son yonlendirilen mesajlar</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchData(true)} className="border-zinc-700">
                  <RefreshIcon />
                  <span className="ml-2">Yenile</span>
                </Button>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    Henuz post gecmisi yok
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-400">Kaynak</TableHead>
                        <TableHead className="text-zinc-400">Tarih</TableHead>
                        <TableHead className="text-zinc-400">Medya</TableHead>
                        <TableHead className="text-zinc-400">Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((post) => (
                        <TableRow key={post.id} className="border-zinc-800">
                          <TableCell>
                            <div>
                              <div className="font-medium text-zinc-200">
                                {post.source_title || 'Kaynak'}
                              </div>
                              <div className="font-mono text-xs text-zinc-500">
                                {post.source_link}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-300">{formatDate(post.created_at)}</TableCell>
                          <TableCell>
                            {post.has_media ? (
                              <Badge variant="secondary">Medya</Badge>
                            ) : (
                              <Badge variant="outline">Metin</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                post.status === "success"
                                  ? "success"
                                  : post.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {post.status === "success"
                                ? "Basarili"
                                : post.status === "failed"
                                ? "Basarisiz"
                                : "Bekliyor"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-zinc-600 text-sm">
          <p>Telegram Forwarder Bot v1.2</p>
          <p className="mt-1">Heroku + Netlify + Neon.tech</p>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
