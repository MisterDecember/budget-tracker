// ============================================
// PIXELVAULT - Pixel Art Charts Module
// ============================================

const PixelCharts = {
    colors: {
        primary: '#f4d03f',
        success: '#2ecc71',
        danger: '#e74c3c',
        info: '#3498db',
        purple: '#9b59b6',
        cyan: '#00d4ff',
        grid: '#34495e',
        text: '#bdc3c7'
    },

    // Create a pixel-style bar chart
    barChart(container, data, options = {}) {
        const { 
            height = 200, 
            barWidth = 30, 
            gap = 10,
            showLabels = true,
            showValues = true,
            colorFn = () => this.colors.primary
        } = options;

        const maxValue = Math.max(...data.map(d => d.value));
        const chartWidth = data.length * (barWidth + gap);
        
        let html = `<div class="pixel-bar-chart" style="height:${height}px;position:relative;">`;
        
        // Grid lines
        for (let i = 0; i <= 4; i++) {
            const y = (i / 4) * 100;
            const value = maxValue - (i / 4) * maxValue;
            html += `<div style="position:absolute;left:0;right:0;top:${y}%;border-top:1px dashed ${this.colors.grid};"></div>`;
            html += `<span style="position:absolute;left:-40px;top:${y - 2}%;font-size:0.35rem;color:${this.colors.text};">$${this.formatNumber(value)}</span>`;
        }

        // Bars
        html += `<div style="display:flex;gap:${gap}px;height:100%;align-items:flex-end;padding-left:10px;">`;
        
        data.forEach((d, i) => {
            const barHeight = (d.value / maxValue) * 100;
            const color = typeof colorFn === 'function' ? colorFn(d) : colorFn;
            
            html += `<div style="display:flex;flex-direction:column;align-items:center;width:${barWidth}px;">`;
            if (showValues) {
                html += `<span style="font-size:0.35rem;color:${this.colors.text};margin-bottom:4px;">$${this.formatNumber(d.value)}</span>`;
            }
            html += `<div style="width:100%;height:${barHeight}%;background:${color};transition:height 0.3s;"></div>`;
            if (showLabels) {
                html += `<span style="font-size:0.35rem;color:${this.colors.text};margin-top:8px;white-space:nowrap;">${d.label}</span>`;
            }
            html += `</div>`;
        });

        html += `</div></div>`;
        container.innerHTML = html;
    },

    // Create a pixel-style line chart
    lineChart(container, data, options = {}) {
        const {
            height = 200,
            lineColor = this.colors.cyan,
            fillColor = 'rgba(0, 212, 255, 0.2)',
            showPoints = true,
            showArea = true
        } = options;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const padding = 40;
        
        canvas.width = container.offsetWidth || 600;
        canvas.height = height;
        canvas.style.width = '100%';
        canvas.style.imageRendering = 'pixelated';
        
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = height - padding * 2;
        
        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const valueRange = maxValue - minValue || 1;

        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding + (i / 4) * chartHeight;
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
            
            const value = maxValue - (i / 4) * valueRange;
            ctx.fillStyle = this.colors.text;
            ctx.font = '8px "Press Start 2P"';
            ctx.textAlign = 'right';
            ctx.fillText('$' + this.formatNumber(value), padding - 5, y + 3);
        }
        ctx.setLineDash([]);

        // Calculate points
        const points = data.map((d, i) => ({
            x: padding + (i / (data.length - 1)) * chartWidth,
            y: padding + ((maxValue - d.value) / valueRange) * chartHeight,
            ...d
        }));

        // Area fill
        if (showArea && points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, padding + chartHeight);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(points[points.length - 1].x, padding + chartHeight);
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
        }

        // Line
        if (points.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 3;
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
        }

        // Points
        if (showPoints) {
            points.forEach(p => {
                ctx.fillStyle = lineColor;
                ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
                ctx.fillStyle = '#16213e';
                ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
            });
        }

        // Labels
        ctx.fillStyle = this.colors.text;
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        const labelStep = Math.ceil(data.length / 6);
        data.forEach((d, i) => {
            if (i % labelStep === 0 || i === data.length - 1) {
                const x = padding + (i / (data.length - 1)) * chartWidth;
                ctx.fillText(d.label, x, canvas.height - 10);
            }
        });

        container.innerHTML = '';
        container.appendChild(canvas);
    },

    // Create a pixel-style donut/pie chart
    pieChart(container, data, options = {}) {
        const { size = 200, donut = true } = options;
        
        const total = data.reduce((sum, d) => sum + d.value, 0);
        const colors = [this.colors.success, this.colors.danger, this.colors.info, 
                       this.colors.purple, this.colors.primary, this.colors.cyan];
        
        let html = `<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;">`;
        
        // SVG Pie
        html += `<svg width="${size}" height="${size}" viewBox="0 0 100 100">`;
        
        let cumulative = 0;
        data.forEach((d, i) => {
            const percentage = d.value / total;
            const startAngle = cumulative * 360;
            const endAngle = (cumulative + percentage) * 360;
            cumulative += percentage;

            const start = this.polarToCartesian(50, 50, 40, startAngle);
            const end = this.polarToCartesian(50, 50, 40, endAngle);
            const largeArc = percentage > 0.5 ? 1 : 0;

            html += `<path d="M 50 50 L ${start.x} ${start.y} A 40 40 0 ${largeArc} 1 ${end.x} ${end.y} Z" 
                     fill="${colors[i % colors.length]}" stroke="#16213e" stroke-width="2"/>`;
        });

        if (donut) {
            html += `<circle cx="50" cy="50" r="25" fill="#16213e"/>`;
            html += `<text x="50" y="48" text-anchor="middle" fill="${this.colors.text}" 
                     style="font-size:6px;font-family:'Press Start 2P'">$${this.formatNumber(total)}</text>`;
            html += `<text x="50" y="58" text-anchor="middle" fill="${this.colors.text}" 
                     style="font-size:4px;font-family:'Press Start 2P'">TOTAL</text>`;
        }

        html += `</svg>`;

        // Legend
        html += `<div style="display:flex;flex-direction:column;gap:8px;">`;
        data.forEach((d, i) => {
            const percentage = ((d.value / total) * 100).toFixed(1);
            html += `<div style="display:flex;align-items:center;gap:8px;">
                <div style="width:12px;height:12px;background:${colors[i % colors.length]};"></div>
                <span style="font-size:0.4rem;color:${this.colors.text};">${d.label}: $${this.formatNumber(d.value)} (${percentage}%)</span>
            </div>`;
        });
        html += `</div></div>`;

        container.innerHTML = html;
    },

    // Progress bar (for debt payoff, savings goals, etc.)
    progressBar(container, current, target, options = {}) {
        const { 
            label = '', 
            showPercentage = true,
            color = this.colors.success 
        } = options;

        const percentage = Math.min((current / target) * 100, 100);
        
        let html = `<div class="pixel-progress">`;
        if (label) {
            html += `<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span style="font-size:0.4rem;color:${this.colors.text};">${label}</span>
                <span style="font-size:0.4rem;color:${this.colors.text};">$${this.formatNumber(current)} / $${this.formatNumber(target)}</span>
            </div>`;
        }
        html += `<div style="height:16px;background:#0f0f1b;border:2px solid ${this.colors.grid};position:relative;">
            <div style="height:100%;width:${percentage}%;background:linear-gradient(90deg, ${color}, ${this.colors.cyan});transition:width 0.5s;"></div>
        </div>`;
        if (showPercentage) {
            html += `<div style="text-align:right;margin-top:4px;">
                <span style="font-size:0.4rem;color:${color};">${percentage.toFixed(1)}%</span>
            </div>`;
        }
        html += `</div>`;

        container.innerHTML = html;
    },

    // Helper functions
    polarToCartesian(cx, cy, r, angle) {
        const rad = (angle - 90) * Math.PI / 180;
        return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad)
        };
    },

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toFixed(0);
    }
};

window.PixelCharts = PixelCharts;
