import { useState, useRef } from 'react';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { BudgetLine, useCreateBudgetLine } from '@/hooks/useBudgets';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  exportBudgetToCSV,
  parseCSVForBudgetImport,
  downloadCSV,
  validateBudgetImport,
  type BudgetCSVData,
} from '@/lib/budget-import-export';
import { useToast } from '@/hooks/use-toast';

interface BudgetImportExportProps {
  budgetId: string;
  budgetName: string;
  budgetLines: BudgetLine[];
}

export function BudgetImportExport({
  budgetId,
  budgetName,
  budgetLines,
}: BudgetImportExportProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState<BudgetCSVData[] | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createBudgetLine = useCreateBudgetLine();
  const { toast } = useToast();

  const handleExport = () => {
    const csv = exportBudgetToCSV(budgetLines, budgetName);
    const filename = `${budgetName.replace(/\s+/g, '_')}_${new Date().getFullYear()}.csv`;
    downloadCSV(csv, filename);
    toast({
      title: 'Budget exported',
      description: `${filename} downloaded successfully`,
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = parseCSVForBudgetImport(text);
      const validation = validateBudgetImport(data);

      setImportData(data);
      setImportErrors(validation.errors);
      setImportWarnings(validation.warnings);
      setShowImportDialog(true);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: 'Failed to parse CSV',
        description:
          error instanceof Error ? error.message : 'Please check your file format',
        variant: 'destructive',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportConfirm = async () => {
    if (!importData) return;

    setIsImporting(true);
    try {
      // Import each line that isn't already in the budget
      const existingCategories = new Set(budgetLines.map((l) => l.category_name));
      const newLines = importData.filter((item) => !existingCategories.has(item.category));

      for (const line of newLines) {
        await createBudgetLine.mutateAsync({
          budget_id: budgetId,
          category_name: line.category,
          january: line.january,
          february: line.february,
          march: line.march,
          april: line.april,
          may: line.may,
          june: line.june,
          july: line.july,
          august: line.august,
          september: line.september,
          october: line.october,
          november: line.november,
          december: line.december,
        });
      }

      toast({
        title: 'Budget imported successfully',
        description: `Added ${newLines.length} new line items`,
      });

      setShowImportDialog(false);
      setImportData(null);
      setImportErrors([]);
      setImportWarnings([]);
    } catch (error) {
      toast({
        title: 'Import failed',
        description:
          error instanceof Error ? error.message : 'An error occurred during import',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
        <Button variant="outline" onClick={handleImportClick}>
          <Upload className="mr-2 h-4 w-4" />
          Import from CSV
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelected}
        className="hidden"
      />

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Budget Data</DialogTitle>
            <DialogDescription>Review the data before importing</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {importErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Import Errors:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {importErrors.map((error, i) => (
                      <li key={i} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {importWarnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Warnings:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {importWarnings.map((warning, i) => (
                      <li key={i} className="text-sm">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {importData && (
              <div>
                <p className="font-semibold mb-2">
                  {importData.length} line item{importData.length !== 1 ? 's' : ''} to import:
                </p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {importData.map((item, i) => (
                    <div key={i} className="text-sm border-b border-gray-200 pb-2 last:border-0">
                      <p className="font-medium">{item.category}</p>
                      <p className="text-gray-600">
                        Annual Total: ${item.total.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportConfirm}
              disabled={
                isImporting ||
                importErrors.length > 0 ||
                !importData ||
                importData.length === 0
              }
            >
              {isImporting ? 'Importing...' : 'Import Lines'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
