package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/hashiguchip/chokunavi/apps/api/ent"
	"github.com/hashiguchip/chokunavi/apps/api/ent/user"
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

// ErrUserNotFound は code が users テーブルに存在しないか revoke 済みのときに返る。
// middleware は errors.Is(err, ErrUserNotFound) で 401 に分岐する。
var ErrUserNotFound = errors.New("user not found")

// UserRepo は ent client を使う UserRepository 実装。
// connection lifecycle は OpenEntClient の呼び出し側が管理する。
type UserRepo struct {
	client *ent.Client
}

// NewUserRepo は ent client を受け取り UserRepository を返す。
func NewUserRepo(client *ent.Client) *UserRepo {
	return &UserRepo{client: client}
}

// FindByCode は plaintext code に一致する非 revoke ユーザーを 1 件返す。
// 一致が無ければ ErrUserNotFound を返す。
func (r *UserRepo) FindByCode(ctx context.Context, code string) (*User, error) {
	row, err := r.client.User.Query().
		Where(user.CodeEQ(code), user.RevokedAtIsNil()).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("query user by code: %w", err)
	}
	return &User{
		ID:        row.ID,
		Label:     row.Label,
		Code:      row.Code,
		RevokedAt: row.RevokedAt,
	}, nil
}
