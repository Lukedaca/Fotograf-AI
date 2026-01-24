import React from 'react';
import type { ActivityEvent } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

const ActivityTimeline: React.FC<{ activity: ActivityEvent[] }> = ({ activity }) => {
  const { t } = useTranslation();

  if (activity.length === 0) {
    return <div className="text-sm text-slate-500">{t.crm_no_activity}</div>;
  }

  return (
    <div className="space-y-4">
      {activity.map((event) => (
        <div key={event.id} className="flex items-start gap-4">
          <div className="mt-1 w-2 h-2 rounded-full bg-cyan-400"></div>
          <div>
            <div className="text-sm text-slate-200 font-semibold">{event.description}</div>
            <div className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
