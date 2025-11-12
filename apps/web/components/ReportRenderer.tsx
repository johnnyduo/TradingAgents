'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface ReportSection {
  title: string;
  content: string;
  icon?: string;
  type?: 'info' | 'positive' | 'negative' | 'neutral';
}

interface MetricCard {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface ReportRendererProps {
  content: string;
  agentName: string;
  agentIcon: string;
}

export default function ReportRenderer({ content, agentName, agentIcon }: ReportRendererProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1]));

  // Parse the content into structured sections
  const parseSections = (text: string): ReportSection[] => {
    if (!text || text.trim() === '' || text === 'Loading report...') {
      return [];
    }

    const sections: ReportSection[] = [];
    
    // Split into paragraphs (double newline or more)
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    
    // If content is short or no clear structure, return as single section
    if (paragraphs.length <= 2 || text.length < 200) {
      return [{
        title: 'Analysis',
        content: text.trim(),
        icon: '📋',
        type: 'info'
      }];
    }
    
    let currentSection: ReportSection | null = null;
    
    paragraphs.forEach((paragraph) => {
      const trimmed = paragraph.trim();
      const firstLine = trimmed.split('\n')[0].trim();
      
      // More strict header detection:
      // 1. Starts with common keywords followed by colon
      // 2. Is a standalone line (no paragraph after it in same block)
      // 3. Is short and looks like a title
      const isHeader = 
        // Pattern like "Overview:" or "Analysis:"
        firstLine.match(/^(Overview|Analysis|Summary|Key Points?|Findings?|Recommendation|Conclusion|Risks?|Opportunities|Trend|Sentiment|Technical|Fundamental|News|Market Outlook|Price Action|Trading Recommendation|Investment Thesis|Bearish Case|Bullish Case|Decision|Reasoning):\s*$/i) ||
        // Standalone short title (less than 40 chars, no punctuation at end except colon)
        (firstLine.length < 40 && firstLine.length > 5 && 
         !firstLine.match(/\.$/) && 
         firstLine.match(/^[A-Z]/) &&
         trimmed.split('\n').length > 1 &&
         firstLine.match(/^(Overview|Analysis|Summary|Key|Finding|Recommendation|Conclusion|Risk|Opportunity|Trend|Sentiment|Technical|Fundamental|News|Market|Price|Volume|Indicator|Outlook|Thesis|Reasoning|Decision)/i));
      
      if (isHeader) {
        // Save previous section
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Determine section type
        let type: 'info' | 'positive' | 'negative' | 'neutral' = 'info';
        let icon = '📋';
        
        if (firstLine.match(/bullish|positive|strength|opportunity|buy|upside|growth|favorable/i)) {
          type = 'positive';
          icon = '📈';
        } else if (firstLine.match(/bearish|negative|risk|concern|sell|downside|decline|warning|caution/i)) {
          type = 'negative';
          icon = '📉';
        } else if (firstLine.match(/technical|indicator|analysis|chart/i)) {
          icon = '📊';
        } else if (firstLine.match(/news|sentiment|article/i)) {
          icon = '📰';
        } else if (firstLine.match(/recommendation|decision|conclusion|outlook/i)) {
          icon = '🎯';
          type = 'neutral';
        } else if (firstLine.match(/overview|summary/i)) {
          icon = '📋';
        }
        
        // Extract content (everything after first line if it's a header)
        const contentLines = trimmed.split('\n').slice(1);
        
        currentSection = {
          title: firstLine.replace(/:\s*$/, ''),
          content: contentLines.join('\n').trim(),
          icon,
          type
        };
      } else if (currentSection) {
        // Add to current section
        currentSection.content += '\n\n' + trimmed;
      } else {
        // No section yet, create default overview section
        currentSection = {
          title: 'Overview',
          content: trimmed,
          icon: '📋',
          type: 'info'
        };
      }
    });
    
    // Add last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // If still no sections, return whole content as one
    if (sections.length === 0) {
      sections.push({
        title: 'Analysis',
        content: text.trim(),
        icon: '📋',
        type: 'info'
      });
    }
    
    return sections;
  };

  // Extract metrics from content (price, percentages, numbers)
  const extractMetrics = (text: string): MetricCard[] => {
    const metrics: MetricCard[] = [];
    
    // Look for price patterns - more specific
    const pricePatterns = [
      /(?:current\s+)?price[:\s]+\$?([\d,]+\.?\d*)/i,
      /trading\s+at[:\s]+\$?([\d,]+\.?\d*)/i,
      /\$\s?([\d,]+\.?\d*)\s+(?:per|price)/i
    ];
    
    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match && parseFloat(match[1].replace(/,/g, '')) > 0) {
        metrics.push({
          label: 'Current Price',
          value: `$${match[1]}`,
          trend: 'neutral'
        });
        break;
      }
    }
    
    // Look for percentage changes - must be near words like "change", "up", "down"
    const changePatterns = [
      /(?:change|moved|up|down|gain|loss)[:\s]+([+\-]?\d+\.?\d*)%/i,
      /([+\-]\d+\.?\d*)%\s+(?:change|move|gain|loss)/i
    ];
    
    for (const pattern of changePatterns) {
      const match = text.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        if (Math.abs(value) <= 100) { // Sanity check: change should be reasonable
          metrics.push({
            label: 'Change',
            value: `${match[1]}%`,
            trend: value > 0 ? 'up' : value < 0 ? 'down' : 'neutral'
          });
          break;
        }
      }
    }
    
    // Look for volume - must be near "volume" word
    const volumeMatch = text.match(/volume[:\s]+(?:of\s+)?(?:about\s+)?([\d,]+\.?\d*)\s*([MBK]|million|billion|thousand)?/i);
    if (volumeMatch && parseFloat(volumeMatch[1].replace(/,/g, '')) > 0) {
      const suffix = volumeMatch[2] ? volumeMatch[2].charAt(0).toUpperCase() : '';
      metrics.push({
        label: 'Volume',
        value: `${volumeMatch[1]}${suffix}`,
        trend: 'neutral'
      });
    }
    
    // Look for sentiment - must be specific values
    const sentimentPatterns = [
      /sentiment[:\s]+(bullish|bearish|positive|negative|neutral|mixed)/i,
      /overall\s+sentiment[:\s]+(?:is\s+)?(bullish|bearish|positive|negative|neutral|mixed)/i,
      /(bullish|bearish)\s+sentiment/i
    ];
    
    for (const pattern of sentimentPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const sentiment = match[1].toLowerCase();
        // Only add if it's a valid sentiment word, not random text
        if (['bullish', 'bearish', 'positive', 'negative', 'neutral', 'mixed'].includes(sentiment)) {
          metrics.push({
            label: 'Sentiment',
            value: match[1].charAt(0).toUpperCase() + match[1].slice(1),
            trend: sentiment.includes('bullish') || sentiment.includes('positive') ? 'up' : 
                   sentiment.includes('bearish') || sentiment.includes('negative') ? 'down' : 'neutral'
          });
          break;
        }
      }
    }
    
    return metrics;
  };

  const sections = parseSections(content);
  const metrics = extractMetrics(content);

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const getSectionColor = (type?: string) => {
    switch (type) {
      case 'positive':
        return 'border-green-500/30 bg-green-500/5';
      case 'negative':
        return 'border-red-500/30 bg-red-500/5';
      case 'neutral':
        return 'border-blue-500/30 bg-blue-500/5';
      default:
        return 'border-slate-700 bg-slate-800/30';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <span className="text-green-400">↗</span>;
      case 'down':
        return <span className="text-red-400">↘</span>;
      default:
        return <span className="text-slate-400">→</span>;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'down':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-slate-400 bg-slate-800/30 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">{agentIcon}</span>
        <div>
          <h3 className="text-xl font-bold text-white">{agentName}</h3>
          <p className="text-sm text-slate-400">Comprehensive analysis report</p>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${getTrendColor(metric.trend)}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium opacity-70">{metric.label}</span>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change && (
                <div className="text-xs mt-1 opacity-70">{metric.change}</div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className={`border rounded-xl overflow-hidden transition-all ${getSectionColor(section.type)}`}
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(index)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <h4 className="text-lg font-semibold text-white">{section.title}</h4>
              </div>
              <motion.span
                animate={{ rotate: expandedSections.has(index) ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-slate-400"
              >
                ▼
              </motion.span>
            </button>

            {/* Section Content */}
            {expandedSections.has(index) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="px-6 pb-6"
              >
                <div className="text-slate-300 leading-relaxed space-y-3">
                  {section.content.split('\n').map((paragraph, pIndex) => {
                    const trimmed = paragraph.trim();
                    
                    // Check if it's a bullet point
                    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.match(/^\d+\./)) {
                      return (
                        <div key={pIndex} className="flex gap-3 items-start">
                          <span className="text-blue-400 mt-1">▸</span>
                          <p className="flex-1">{trimmed.replace(/^[•\-\d+\.]\s*/, '')}</p>
                        </div>
                      );
                    }
                    
                    // Regular paragraph
                    if (trimmed) {
                      return <p key={pIndex}>{trimmed}</p>;
                    }
                    return null;
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
