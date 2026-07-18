import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#13161F", border: "1px solid #2C3250",
      borderRadius: 10, padding: "10px 14px", fontSize: 12,
    }}>
      <div style={{ color: "#9DA3C0", marginBottom: 6, fontWeight: 600 }}>Day {label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.fill, fontFamily: "JetBrains Mono, monospace" }}>
          {p.name}: ₹{p.value}
        </div>
      ))}
      {payload[0] && payload[0].payload.km > 0 && (
        <div style={{ color: "#4B90FF", fontFamily: "JetBrains Mono, monospace", marginTop: 4 }}>
          Distance: {payload[0].payload.km.toFixed(1)} km
        </div>
      )}
    </div>
  );
};

export default function EarningsChart({ data }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <span className="chart-title">Daily Earning vs Expense</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={2} barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="#232840" vertical={false} />
          <XAxis
            dataKey="day" stroke="#565E80" fontSize={10}
            tickLine={false} axisLine={false}
            tickFormatter={(v) => v % 5 === 0 || v === 1 ? v : ""}
          />
          <YAxis
            stroke="#565E80" fontSize={10} tickLine={false}
            axisLine={false} width={40}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1F2436" }} />
          <Bar dataKey="earning" fill="#F5C518" radius={[4, 4, 0, 0]} name="Earning" maxBarSize={18}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.earning > 0 ? "#F5C518" : "#232840"} />
            ))}
          </Bar>
          <Bar dataKey="expense" fill="#F44" radius={[4, 4, 0, 0]} name="Expense" maxBarSize={18}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.expense > 0 ? "#F44" : "#232840"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
