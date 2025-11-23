type Row = Record<string, any>;

interface Filter {
  field: string;
  value: any;
  op: 'eq' | 'in';
}

class QueryBuilder {
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: Row[] = [];
  private updates: Row | null = null;
  private filters: Filter[] = [];
  private orderField?: string;
  private ascending = true;

  constructor(private table: string, private supabase: SupabaseMock) {}

  select(_columns = '*') {
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value, op: 'eq' });
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push({ field, value: values, op: 'in' });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.ascending = options?.ascending !== false;
    return this;
  }

  insert(rows: Row | Row[]) {
    this.action = 'insert';
    this.payload = Array.isArray(rows) ? rows.slice() : [rows];
    return this;
  }

  update(values: Row) {
    this.action = 'update';
    this.updates = values;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this.execute(false);
  }

  async single() {
    const { data, error } = await this.execute(true);
    return { data: data ?? null, error: error ?? (data ? null : { message: 'No rows' }) };
  }

  async execute(single = false) {
    let rows = this.supabase.getTable(this.table);
    rows = this.applyFilters(rows);

    if (this.action === 'insert') {
      const inserted = this.payload.map((row) => this.supabase.withId(this.table, row));
      this.supabase.pushRows(this.table, inserted);
      rows = inserted;
    } else if (this.action === 'update' && this.updates) {
      rows.forEach((row) => Object.assign(row, this.updates));
    } else if (this.action === 'delete') {
      this.supabase.removeRows(this.table, rows);
    }

    if (this.orderField) {
      rows = rows
        .slice()
        .sort((a, b) =>
          this.ascending
            ? (a[this.orderField!] ?? 0) > (b[this.orderField!] ?? 0)
              ? 1
              : -1
            : (a[this.orderField!] ?? 0) < (b[this.orderField!] ?? 0)
            ? 1
            : -1
        );
    }

    if (single) {
      return { data: rows[0], error: rows[0] ? null : { message: 'No rows' } };
    }
    return { data: rows, error: null };
  }

  private applyFilters(rows: Row[]): Row[] {
    return rows.filter((row) => {
      return this.filters.every((filter) => {
        if (filter.op === 'eq') {
          return row[filter.field] === filter.value;
        }
        if (filter.op === 'in') {
          return Array.isArray(filter.value) && filter.value.includes(row[filter.field]);
        }
        return true;
      });
    });
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: Row[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute(false).then(onfulfilled, onrejected);
  }
}

interface BroadcastRecord {
  channel: string;
  event: string;
  payload: Record<string, unknown>;
}

export class SupabaseMock {
  tables: Record<string, Row[]> = {};
  broadcasts: BroadcastRecord[] = [];
  removedChannels: string[] = [];
  private counters: Record<string, number> = {};

  constructor(initial?: Record<string, Row[]>) {
    this.reset(initial);
  }

  private ensureTable(table: string) {
    if (!this.tables[table]) {
      this.tables[table] = [];
    }
  }

  reset(initial?: Record<string, Row[]>) {
    this.tables = {
      rooms: [],
      players: [],
      assignments: [],
      votes: [],
      imposter_clues: [],
      imposter_votes: [],
      ...(initial || {}),
    };
    this.broadcasts = [];
    this.removedChannels = [];
    this.counters = {};
  }

  from(table: string) {
    this.ensureTable(table);
    return new QueryBuilder(table, this);
  }

  channel(name: string) {
    const supabase = this;
    return {
      name,
      async send(message: { type: string; event: string; payload: Record<string, unknown> }) {
        supabase.broadcasts.push({
          channel: name,
          event: message.event,
          payload: message.payload,
        });
        return { status: 'ok' };
      },
    };
  }

  removeChannel(channel: { name?: string }) {
    if (channel?.name) {
      this.removedChannels.push(channel.name);
    }
  }

  getTable(table: string): Row[] {
    this.ensureTable(table);
    return this.tables[table];
  }

  pushRows(table: string, rows: Row[]) {
    this.ensureTable(table);
    this.tables[table].push(...rows);
  }

  removeRows(table: string, rows: Row[]) {
    this.ensureTable(table);
    const set = new Set(rows);
    this.tables[table] = this.tables[table].filter((row) => !set.has(row));
  }

  withId(table: string, row: Row): Row {
    if (row.id) return { ...row };
    const next = (this.counters[table] || 0) + 1;
    this.counters[table] = next;
    return { id: `${table}-${next}`, ...row };
  }
}

export function createSupabaseMock(initial?: Record<string, Row[]>) {
  return new SupabaseMock(initial);
}
