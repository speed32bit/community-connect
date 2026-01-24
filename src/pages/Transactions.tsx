import { useState } from 'react';
import { BookOpen, Search, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTransactions, useTransactionCategories, useCreateTransaction } from '@/hooks/useTransactions';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/format';
import { TransactionType } from '@/types/database';

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    type: 'income' as TransactionType,
    amount: '',
    description: '',
    category_id: '',
  });

  const { data: transactions, isLoading } = useTransactions();
  const { data: categories } = useTransactionCategories();
  const createTransaction = useCreateTransaction();

  const filteredTransactions = transactions?.filter((txn) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      txn.description.toLowerCase().includes(search) ||
      txn.category?.name?.toLowerCase().includes(search)
    );
  });

  const handleCreate = async () => {
    await createTransaction.mutateAsync({
      ...newTransaction,
      amount: parseFloat(newTransaction.amount),
      category_id: newTransaction.category_id || undefined,
    });
    setShowCreateDialog(false);
    setNewTransaction({
      transaction_date: new Date().toISOString().split('T')[0],
      type: 'income',
      amount: '',
      description: '',
      category_id: '',
    });
  };

  // Calculate running balance
  const transactionsWithBalance = [...(filteredTransactions || [])].reverse().reduce((acc, txn) => {
    const lastBalance = acc.length > 0 ? acc[acc.length - 1].runningBalance : 0;
    const amount = txn.type === 'income' ? Number(txn.amount) : -Number(txn.amount);
    acc.push({ ...txn, runningBalance: lastBalance + amount });
    return acc;
  }, [] as (typeof transactions extends (infer T)[] | undefined ? T & { runningBalance: number } : never)[]).reverse();

  const filteredCategories = categories?.filter(c => c.type === newTransaction.type);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="View and manage general ledger entries"
        actions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>General Ledger</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          ) : transactionsWithBalance.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No transactions found"
              description="Transactions will appear here once recorded."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsWithBalance.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>{formatDate(txn.transaction_date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {txn.type === 'income' ? (
                          <ArrowDownRight className="h-4 w-4 text-success" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-destructive" />
                        )}
                        {txn.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{txn.category?.name || 'Uncategorized'}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {txn.type === 'expense' ? formatCurrency(txn.amount) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      {txn.type === 'income' ? formatCurrency(txn.amount) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(txn.runningBalance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newTransaction.type}
                  onValueChange={(value: TransactionType) => 
                    setNewTransaction({ ...newTransaction, type: value, category_id: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newTransaction.transaction_date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newTransaction.category_id}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter description..."
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!newTransaction.amount || !newTransaction.description || createTransaction.isPending}
            >
              {createTransaction.isPending ? 'Saving...' : 'Save Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
