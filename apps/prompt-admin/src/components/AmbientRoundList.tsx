import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AmbientRoundForm from './AmbientRoundForm';
import AmbientRoundBulkImport from './AmbientRoundBulkImport';
import AIPromptGeneratorTabs from './AIPromptGeneratorTabs';
import {
  createAmbientRound,
  deleteAmbientRound,
  getAmbientRounds,
  getAmbientPacks,
  replaceAllAmbientRounds,
  reorderAmbientRounds,
  updateAmbientRound,
} from '../services/ambientRoundsDatabase';
import type { AmbientRound, AmbientRoundExportRow } from '../types/ambientRounds';
import { getErrorMessage } from '../utils/get-error-message';
import { showToast } from './Toast';

export default function AmbientRoundList() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'trivia' | 'topic'>('all');
  const [selectedPackId, setSelectedPackId] = useState<string>('00000000-0000-0000-0000-000000000001');

  const packsQuery = useQuery({
    queryKey: ['ambient_packs'],
    queryFn: getAmbientPacks,
  });
  const packs = packsQuery.data ?? [];
  const selectedPack = packs.find(p => p.id === selectedPackId) || packs[0];

  const roundsQuery = useQuery({
    queryKey: ['ambient_rounds', selectedPackId],
    queryFn: () => getAmbientRounds(selectedPackId),
  });
  const rounds = roundsQuery.data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ambient_rounds', selectedPackId] });

  const filtered = rounds.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      return r.title.toLowerCase().includes(term) || (r.content ?? '').toLowerCase().includes(term);
    }
    return true;
  });

  const createMutation = useMutation({
    mutationFn: (round: Omit<AmbientRound, 'id' | 'created_at' | 'updated_at'>) => 
      createAmbientRound(selectedPackId, round),
    onSuccess: async () => { setShowCreate(false); await invalidate(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AmbientRound> }) =>
      updateAmbientRound(id, data),
    onSuccess: async () => { setEditingId(null); await invalidate(); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAmbientRound,
    onSuccess: async () => invalidate(),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => reorderAmbientRounds(selectedPackId, orderedIds),
    onSuccess: invalidate,
  });

  // Use reorderMutation to avoid unused variable warning
  void reorderMutation;

  const importMutation = useMutation({
    mutationFn: (rows: AmbientRoundExportRow[]) => replaceAllAmbientRounds(selectedPackId, rows),
    onSuccess: async () => { setShowImport(false); await invalidate(); },
  });

  const handleDelete = async (round: AmbientRound): Promise<void> => {
    if (!confirm(`Delete "${round.title}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(round.id);
    } catch (e) {
      showToast(getErrorMessage(e, 'Delete failed'), 'error');
    }
  };

  const handleMove = async (fromIndex: number, dir: -1 | 1): Promise<void> => {
    const toIndex = fromIndex + dir;
    if (toIndex < 0 || toIndex >= rounds.length) return;
    const next = [...rounds];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    try {
      await reorderAmbientRounds(selectedPackId, next.map(r => r.id));
      await invalidate();
    } catch (e) {
      showToast(getErrorMessage(e, 'Reorder failed'), 'error');
    }
  };

  const handleExport = (): void => {
    const exported: AmbientRoundExportRow[] = rounds.map(r => ({
      order_index: r.order_index,
      type: r.type,
      title: r.title,
      content: r.content,
      settings: r.settings,
    }));
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ambient-rounds.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (rows: AmbientRoundExportRow[]): Promise<void> => {
    if (!confirm(`Replace all ${rounds.length} existing rounds with ${rows.length} imported rounds? This cannot be undone.`)) return;
    try {
      await importMutation.mutateAsync(rows);
    } catch (e) {
      showToast(getErrorMessage(e, 'Import failed'), 'error');
    }
  };

  if (roundsQuery.isLoading || packsQuery.isLoading) return <div className="loading">Loading ambient rounds...</div>;

  return (
    <div className="prompt-list">
      {/* AI Prompt Generator */}
      <AIPromptGeneratorTabs type="ambient" />

      <div className="prompt-header">
        <div>
          <h2>Ambient Rounds</h2>
          <p className="prompt-subtitle">{rounds.length} rounds in {selectedPack?.name || 'library'}</p>
        </div>
        <div className="prompt-header-actions">
          {/* Pack Selector */}
          <select 
            value={selectedPackId} 
            onChange={(e) => setSelectedPackId(e.target.value)}
            className="pack-selector"
            style={{ marginRight: '8px', padding: '4px 8px' }}
          >
            {packs.map(pack => (
              <option key={pack.id} value={pack.id}>
                {pack.emoji} {pack.name}
              </option>
            ))}
          </select>
          <span className="prompt-count">{rounds.length} rounds</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="prompt-toolbar">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Add Round</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>Export JSON</button>
          </div>
      </div>

      {/* Bulk Import Dropdown */}
      <div className="ai-prompt-generator" style={{ 
        background: '#fef3c7', 
        border: '1px solid #f59e0b', 
        borderRadius: '8px', 
        marginBottom: '16px',
        fontSize: '14px',
        overflow: 'hidden'
      }}>
        <div 
          style={{ 
            padding: '12px 16px', 
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(245, 158, 11, 0.1)',
            borderBottom: showImport ? '1px solid #f59e0b' : 'none'
          }}
          onClick={() => setShowImport(v => !v)}
        >
          <h4 style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
            Bulk Import
          </h4>
          <span style={{ 
            fontSize: '12px', 
            color: '#f59e0b',
            transition: 'transform 0.2s',
            transform: showImport ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block'
          }}>
            &#9662;
          </span>
        </div>

        {showImport && (
          <div style={{ padding: '16px' }}>
            <AmbientRoundBulkImport onImport={handleImport} />
          </div>
        )}
      </div>

      {showCreate && (
        <AmbientRoundForm
          mode="create"
          nextOrderIndex={rounds.length}
          onSubmit={async data => { await createMutation.mutateAsync(data); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      <div className="prompt-toolbar">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
          <option value="all">All types</option>
          <option value="trivia">Trivia only</option>
          <option value="topic">Topic only</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search rounds..."
        />
      </div>

      <div className="prompts">
        {filtered.map(round => {
          const globalIdx = rounds.findIndex(r => r.id === round.id);
          const s = round.settings as any;
          const formatBadge = round.type === 'trivia'
            ? (s.format === 'multiple_choice' ? 'MC' : 'Written')
            : 'Topic';

          return editingId === round.id ? (
            <AmbientRoundForm
              key={round.id}
              mode="edit"
              initialData={round}
              nextOrderIndex={round.order_index}
              onSubmit={async data => {
                await updateMutation.mutateAsync({ id: round.id, data });
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={round.id} className="prompt-item">
              <div className="prompt-index">{round.order_index + 1}</div>
              <div style={{ flex: 1 }}>
                <div className="prompt-text">
                  <strong>{round.title}</strong>
                  {' '}
                  <span className="prompt-count" style={{ fontSize: 11 }}>
                    [{round.type} · {formatBadge}
                    {s.categoryKey ? ` · ${s.categoryKey}` : ''}]
                  </span>
                </div>
                {round.content && (
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {round.content.length > 120 ? round.content.slice(0, 120) + '...' : round.content}
                  </div>
                )}
              </div>
              <div className="prompt-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(round.id)}>Edit</button>
                <button className="btn btn-secondary btn-sm" onClick={() => void handleMove(globalIdx, -1)} disabled={globalIdx === 0}>^</button>
                <button className="btn btn-secondary btn-sm" onClick={() => void handleMove(globalIdx, 1)} disabled={globalIdx === rounds.length - 1}>v</button>
                <button className="btn btn-danger btn-sm" onClick={() => void handleDelete(round)}>Delete</button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty-prompts">No rounds match that filter.</div>
        )}
      </div>
    </div>
  );
}
