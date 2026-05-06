import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAmbientPacks,
  createAmbientPack,
  updateAmbientPack,
  deleteAmbientPack,
  getAmbientRoundCount,
} from '../services/ambientRoundsDatabase';
import type { AmbientPack } from '../services/ambientRoundsDatabase';
import { getErrorMessage } from '../utils/get-error-message';
import { showToast } from './Toast';

/**
 * AmbientPackManager - Dedicated Pack Management Section
 * 
 * PURPOSE: Full CRUD interface for ambient packs. Allows the host to create,
 * rename, reorder, and delete themed content collections (packs).
 * 
 * USAGE: Rendered as a collapsible section within the Ambient Rounds page,
 * separate from the round list itself.
 */

interface PackFormData {
  name: string;
  emoji: string;
  description: string;
  is_default: boolean;
}

const EMPTY_FORM: PackFormData = {
  name: '',
  emoji: '📦',
  description: '',
  is_default: false,
};

const EMOJI_OPTIONS = ['📦', '🎯', '🧠', '🏈', '🎵', '🎬', '🌍', '🔬', '🍺', '🎲', '⭐', '🎄', '🏆', '💡', '🎉', '🃏'];

export default function AmbientPackManager() {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<PackFormData>(EMPTY_FORM);

  const packsQuery = useQuery({
    queryKey: ['ambient_packs'],
    queryFn: getAmbientPacks,
  });
  const packs = packsQuery.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ambient_packs'] });

  const createMutation = useMutation({
    mutationFn: (data: PackFormData) => createAmbientPack({
      name: data.name,
      emoji: data.emoji,
      description: data.description || undefined,
      is_default: data.is_default,
      sort_order: packs.length,
    }),
    onSuccess: async () => {
      await invalidate();
      setShowCreate(false);
      setFormData(EMPTY_FORM);
      showToast('Pack created', 'success');
    },
    onError: (e) => showToast(getErrorMessage(e, 'Create failed'), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PackFormData }) => updateAmbientPack(id, {
      name: data.name,
      emoji: data.emoji,
      description: data.description || undefined,
      is_default: data.is_default,
    }),
    onSuccess: async () => {
      await invalidate();
      setEditingId(null);
      setFormData(EMPTY_FORM);
      showToast('Pack updated', 'success');
    },
    onError: (e) => showToast(getErrorMessage(e, 'Update failed'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAmbientPack,
    onSuccess: async () => {
      await invalidate();
      showToast('Pack deleted', 'success');
    },
    onError: (e) => showToast(getErrorMessage(e, 'Delete failed'), 'error'),
  });

  const handleStartEdit = (pack: AmbientPack) => {
    setEditingId(pack.id);
    setShowCreate(false);
    setFormData({
      name: pack.name,
      emoji: pack.emoji,
      description: pack.description || '',
      is_default: pack.is_default,
    });
  };

  const handleDelete = async (pack: AmbientPack) => {
    const count = await getAmbientRoundCount(pack.id);
    if (count > 0) {
      showToast(`Cannot delete "${pack.name}" — it has ${count} round${count === 1 ? '' : 's'}. Remove all rounds first.`, 'error');
      return;
    }
    if (!confirm(`Delete pack "${pack.emoji} ${pack.name}"? This cannot be undone.`)) return;
    await deleteMutation.mutateAsync(pack.id);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      showToast('Pack name is required', 'error');
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowCreate(false);
    setFormData(EMPTY_FORM);
  };

  const bgColor = '#f5f3ff';
  const borderColor = '#8b5cf6';
  const textColor = '#5b21b6';

  return (
    <div style={{
      background: bgColor,
      border: '1px solid ' + borderColor,
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      overflow: 'hidden',
    }}>
      <div
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(139, 92, 246, 0.08)',
          borderBottom: isExpanded ? '1px solid ' + borderColor : 'none',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 style={{ margin: 0, color: textColor, fontSize: '14px' }}>
          Pack Manager
        </h4>
        <span style={{
          fontSize: '12px',
          color: borderColor,
          transition: 'transform 0.2s',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'inline-block',
        }}>
          &#9662;
        </span>
      </div>

      {isExpanded && (
        <div style={{ padding: '16px' }}>
          {/* Pack List */}
          <div style={{ marginBottom: '12px' }}>
            {packs.length === 0 && (
              <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0' }}>No packs yet. Create one to get started.</p>
            )}
            {packs.map(pack => (
              <div
                key={pack.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  background: editingId === pack.id ? '#ede9fe' : 'white',
                  border: '1px solid ' + (editingId === pack.id ? borderColor : '#e5e7eb'),
                  borderRadius: '6px',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '18px' }}>{pack.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                    {pack.name}
                    {pack.is_default && (
                      <span style={{ fontSize: '10px', color: '#16a34a', marginLeft: '6px', fontWeight: 'normal' }}>DEFAULT</span>
                    )}
                  </div>
                  {pack.description && (
                    <div style={{ fontSize: '11px', color: '#666' }}>{pack.description}</div>
                  )}
                </div>
                <PackRoundCount packId={pack.id} />
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => { e.stopPropagation(); handleStartEdit(pack); }}
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => { e.stopPropagation(); void handleDelete(pack); }}
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    disabled={pack.is_default}
                    title={pack.is_default ? 'Cannot delete default pack' : 'Delete pack'}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Create/Edit Form */}
          {(showCreate || editingId) && (
            <div style={{
              background: 'white',
              border: '1px solid ' + borderColor,
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '12px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: textColor, marginBottom: '10px' }}>
                {editingId ? 'Edit Pack' : 'New Pack'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Emoji</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '160px' }}>
                    {EMOJI_OPTIONS.map(e => (
                      <button
                        key={e}
                        onClick={() => setFormData(prev => ({ ...prev, emoji: e }))}
                        style={{
                          width: '28px',
                          height: '28px',
                          fontSize: '16px',
                          border: formData.emoji === e ? '2px solid ' + borderColor : '1px solid #e5e7eb',
                          borderRadius: '4px',
                          background: formData.emoji === e ? '#ede9fe' : 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Sports Sunday"
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g. Sports trivia for game day screenings"
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={e => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    />
                    Set as default pack
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{ fontSize: '12px' }}
                >
                  {editingId ? 'Save Changes' : 'Create Pack'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCancel}
                  style={{ fontSize: '12px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add Pack Button */}
          {!showCreate && !editingId && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setShowCreate(true); setFormData(EMPTY_FORM); }}
              style={{ fontSize: '12px' }}
            >
              + New Pack
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Small inline component to show round count per pack */
function PackRoundCount({ packId }: { packId: string }) {
  const countQuery = useQuery({
    queryKey: ['ambient_round_count', packId],
    queryFn: () => getAmbientRoundCount(packId),
    staleTime: 30_000,
  });
  const count = countQuery.data ?? 0;

  return (
    <span style={{ fontSize: '11px', color: '#666', minWidth: '50px', textAlign: 'right' }}>
      {count} round{count === 1 ? '' : 's'}
    </span>
  );
}
