package repository

import (
	"context"
	"errors"
	"time"
)

// User は referral code を持つチョクナビ閲覧者。
//
// Code は plaintext 保持。RevokedAt が non-nil なら revoke 済み (auth は通さない)。
// FindByCode は revoke 済みを既に弾いて返すので、handler/middleware 側で
// RevokedAt を再チェックする必要はない。
type User struct {
	ID        int
	Label     string
	Code      string
	RevokedAt *time.Time
}

// UserRepository は middleware が referral code を検証するための read interface。
type UserRepository interface {
	FindByCode(ctx context.Context, code string) (*User, error)
}

// ErrUserNotFound は code が seed に存在しないか revoke 済みのときに返る。
// middleware は errors.Is(err, ErrUserNotFound) で 401 に分岐する。
var ErrUserNotFound = errors.New("user not found")
