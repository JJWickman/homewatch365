import React from 'react';
import { ExternalLink, CheckCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const HomeWatchAcademyDisclaimer = () => {
  return (
    <div className="mb-6 p-6 border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-white rounded-lg">
      <div className="flex items-start gap-4">
        {/* Home Watch Academy Logo */}
        <div className="flex-shrink-0">
          <img 
            src="https://media.base44.com/images/public/696806e88e744d6cc803e3bb/0450a8076_image.png" 
            alt="Home Watch Academy" 
            className="h-16 w-auto"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-lg font-semibold text-slate-900">Best Practices Structure</h3>
            <Badge className="bg-green-100 text-green-800 border-green-200">Home Watch Academy</Badge>
          </div>
          
          <p className="text-sm text-slate-700 mb-3">
            The pricing structure and service configurations on this page follow industry best practices established by the 
            <a 
              href="https://www.yourhwp.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-green-600 hover:text-green-700 ml-1 inline-flex items-center gap-1"
            >
              Home Watch Academy
              <ExternalLink className="h-3 w-3" />
            </a>
            , the leading professional organization for home watch professionals.
          </p>

          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Professional service structures and pricing models</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Industry-standard terminology and best practices</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Clear distinction between service types and pricing models</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeWatchAcademyDisclaimer;