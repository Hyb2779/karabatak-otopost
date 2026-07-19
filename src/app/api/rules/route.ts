import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function ensureRulesTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS forwarding_rules (
        id SERIAL PRIMARY KEY,
        source_channel_id INTEGER REFERENCES source_channels(id) ON DELETE CASCADE,
        name TEXT DEFAULT '',
        match_keywords TEXT DEFAULT '',
        target_channel_ids INTEGER[] DEFAULT '{}',
        append_link TEXT DEFAULT '',
        append_link_text TEXT DEFAULT '',
        remove_links BOOLEAN DEFAULT TRUE,
        keep_link_keywords TEXT DEFAULT '',
        send_link_back BOOLEAN DEFAULT FALSE,
        priority INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    console.error('ensureRulesTable error:', e);
  }
}

// GET /api/rules?source_channel_id=123  (veya tümü)
export async function GET(request: Request) {
  try {
    await ensureRulesTable();
    const { searchParams } = new URL(request.url);
    const sourceChannelId = searchParams.get('source_channel_id');

    const targetsSubquery = `
      COALESCE(
        (SELECT json_agg(json_build_object('id', tc.id, 'title', tc.title, 'chat_id', tc.chat_id))
         FROM target_channels tc
         WHERE tc.id = ANY(r.target_channel_ids)),
        '[]'::json
      ) as targets
    `;

    let result;
    if (sourceChannelId) {
      result = await query(
        `SELECT r.*, ${targetsSubquery}
         FROM forwarding_rules r
         WHERE r.source_channel_id = $1
         ORDER BY r.priority DESC, r.id ASC`,
        [sourceChannelId]
      );
    } else {
      result = await query(
        `SELECT r.*, ${targetsSubquery}
         FROM forwarding_rules r
         ORDER BY r.source_channel_id ASC, r.priority DESC, r.id ASC`
      );
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

function normalizeTargetIds(ids: unknown): number[] {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((v) => parseInt(String(v), 10))
    .filter((n) => !Number.isNaN(n));
}

// POST /api/rules
export async function POST(request: Request) {
  try {
    await ensureRulesTable();
    const body = await request.json();
    const {
      source_channel_id,
      name,
      match_keywords,
      target_channel_ids,
      append_link,
      append_link_text,
      remove_links,
      keep_link_keywords,
      send_link_back,
      priority,
    } = body;

    if (!source_channel_id) {
      return NextResponse.json({ error: 'source_channel_id gerekli' }, { status: 400 });
    }

    const ids = normalizeTargetIds(target_channel_ids);
    if (ids.length === 0) {
      return NextResponse.json({ error: 'En az bir hedef kanal secin' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO forwarding_rules
        (source_channel_id, name, match_keywords, target_channel_ids,
         append_link, append_link_text, remove_links, keep_link_keywords,
         send_link_back, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        parseInt(String(source_channel_id), 10),
        name || '',
        match_keywords || '',
        ids,
        append_link || '',
        append_link_text || '',
        remove_links !== false,
        keep_link_keywords || '',
        send_link_back === true,
        parseInt(String(priority ?? 0), 10) || 0,
      ]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }
}

// PUT /api/rules
export async function PUT(request: Request) {
  try {
    await ensureRulesTable();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rule ID gerekli' }, { status: 400 });
    }

    const setClause: string[] = [];
    const values: unknown[] = [parseInt(String(id), 10)];
    let p = 2;

    const textFields = ['name', 'match_keywords', 'append_link', 'append_link_text', 'keep_link_keywords'];
    for (const f of textFields) {
      if (updates[f] !== undefined) {
        setClause.push(`${f} = $${p}`);
        values.push(updates[f] || '');
        p++;
      }
    }

    if (updates.target_channel_ids !== undefined) {
      const ids = normalizeTargetIds(updates.target_channel_ids);
      setClause.push(`target_channel_ids = $${p}`);
      values.push(ids);
      p++;
    }
    if (updates.remove_links !== undefined) {
      setClause.push(`remove_links = $${p}`);
      values.push(updates.remove_links !== false);
      p++;
    }
    if (updates.send_link_back !== undefined) {
      setClause.push(`send_link_back = $${p}`);
      values.push(updates.send_link_back === true);
      p++;
    }
    if (updates.is_active !== undefined) {
      setClause.push(`is_active = $${p}`);
      values.push(updates.is_active === true);
      p++;
    }
    if (updates.priority !== undefined) {
      setClause.push(`priority = $${p}`);
      values.push(parseInt(String(updates.priority), 10) || 0);
      p++;
    }

    if (setClause.length === 0) {
      return NextResponse.json({ error: 'Guncellenecek alan yok' }, { status: 400 });
    }

    setClause.push('updated_at = CURRENT_TIMESTAMP');

    const result = await query(
      `UPDATE forwarding_rules SET ${setClause.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating rule:', error);
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}

// DELETE /api/rules?id=123
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing rule ID' }, { status: 400 });
    }
    await query('DELETE FROM forwarding_rules WHERE id = $1', [parseInt(id, 10)]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rule:', error);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}
