import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { Mail, ArrowLeft } from 'lucide-react';

export function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
          <CardDescription>Enter your email and we'll send you reset instructions</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="mb-4">
            <AlertDescription className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Password reset functionality will be implemented in Phase 2.</span>
            </AlertDescription>
          </Alert>

          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled
              />
              <p className="text-xs text-muted-foreground">This feature is not yet implemented.</p>
            </div>

            <Button type="submit" className="w-full" disabled>
              Send reset link
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="flex items-center justify-center space-x-1 text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to login</span>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}