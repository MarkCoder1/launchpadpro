import React, { useState } from 'react'
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "../ui/dialog"
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface DeleteAccountModalProps {
    isOpen: boolean
    onClose: () => void
    userEmail?: string
}

export default function DeleteAccountModal({
    isOpen,
    onClose,
    userEmail
}: DeleteAccountModalProps) {
    const [confirmText, setConfirmText] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const requiredConfirmText = 'DELETE MY ACCOUNT'

    const handleClose = () => {
        if (!loading) {
            setConfirmText('')
            setError('')
            onClose()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()


        if (confirmText !== requiredConfirmText) {
            setError(`Please type "${requiredConfirmText}" to confirm`)
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/user/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete account')
            }

            // Account deleted successfully - sign out and redirect
            await signOut({ redirect: false })
            router.push('/')
        } catch (error: any) {
            setError(error.message || 'Failed to delete account')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-red-600">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Delete Account
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete your account and all associated data.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                    <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="text-sm text-red-800">
                            <p className="font-medium mb-2">Warning: This action is irreversible!</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Your profile and personal information will be deleted</li>
                                <li>All your saved career data will be lost</li>
                                <li>Your CV and portfolio data will be removed</li>
                                <li>You will be immediately signed out</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email-confirm">
                            Please confirm your email address: <span className="font-medium">{userEmail}</span>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            You are about to delete the account associated with this email.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-text">
                            Type <span className="font-mono bg-gray-100 px-1 rounded">{requiredConfirmText}</span> to confirm:
                        </Label>
                        <Input
                            id="confirm-text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={requiredConfirmText}
                            className={confirmText !== requiredConfirmText && confirmText.length > 0 ? 'border-red-500' : ''}
                            disabled={loading}
                        />
                    </div>



                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={loading || confirmText !== requiredConfirmText}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Account
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}