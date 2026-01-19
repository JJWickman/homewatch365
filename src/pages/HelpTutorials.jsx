import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Play, Clock, BookOpen } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import TutorialModal from '@/components/help/TutorialModal';
import { tutorials, tutorialCategories } from '@/components/help/tutorialData';

export default function HelpTutorials() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);

  const filteredTutorials = Object.values(tutorials).filter(tutorial =>
    tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutorial.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartTutorial = (tutorial) => {
    setSelectedTutorial(tutorial);
    setShowTutorial(true);
  };

  return (
    <div>
      <PageHeader
        title="Help & Tutorials"
        subtitle="Learn how to use Estate IQ with step-by-step guides"
      />

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search tutorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Object.keys(tutorials).length}</p>
                <p className="text-sm text-slate-600">Available Tutorials</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Play className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">Interactive</p>
                <p className="text-sm text-slate-600">Step-by-Step Guides</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">3-5 min</p>
                <p className="text-sm text-slate-600">Average Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tutorial Categories */}
      {searchQuery === '' ? (
        tutorialCategories.map((category) => (
          <div key={category.name} className="mb-8">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-900">{category.name}</h2>
              <p className="text-slate-600">{category.description}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.tutorials.map((tutorialId) => {
                const tutorial = tutorials[tutorialId];
                const Icon = tutorial.icon;
                
                return (
                  <Card key={tutorial.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <Badge variant="outline" className="bg-slate-50">
                          <Clock className="h-3 w-3 mr-1" />
                          {tutorial.duration}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                      <CardDescription>{tutorial.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => handleStartTutorial(tutorial)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Tutorial
                      </Button>
                      <p className="text-xs text-slate-500 text-center mt-2">
                        {tutorial.steps.length} steps
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        /* Search Results */
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Search Results ({filteredTutorials.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tutorial) => {
              const Icon = tutorial.icon;
              
              return (
                <Card key={tutorial.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="outline" className="bg-slate-50">
                        <Clock className="h-3 w-3 mr-1" />
                        {tutorial.duration}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                    <CardDescription>{tutorial.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleStartTutorial(tutorial)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Tutorial
                    </Button>
                    <p className="text-xs text-slate-500 text-center mt-2">
                      {tutorial.steps.length} steps
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredTutorials.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600">No tutorials found matching your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Tutorial Modal */}
      <TutorialModal
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
        tutorial={selectedTutorial}
      />
    </div>
  );
}