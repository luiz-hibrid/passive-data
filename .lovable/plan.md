## Mostrar valor dentro das barras — Funil por etapa

Adicionar rótulos com o número de leads dentro de cada barra do gráfico horizontal "Funil por etapa".

### Mudanças em `src/routes/index.tsx`

1. Importar `LabelList` de `recharts` (junto aos outros imports).
2. Dentro do `<Bar dataKey="leads">` do gráfico de etapas, adicionar:
   ```tsx
   <LabelList
     dataKey="leads"
     position="insideRight"
     formatter={(v) => fmt(v as number)}
     fill="#fff"
     fontSize={12}
     fontWeight={600}
   />
   ```
3. Para barras muito curtas, usar `position="right"` como fallback visual? — manter `insideRight` simples; valores pequenos ainda ficarão legíveis pois ficam ancorados à direita da barra.

Sem alterações em dados, estilos globais ou outros gráficos.