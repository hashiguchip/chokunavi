// Atlas は migration apply / lint / status を担当する。
// migration ファイル自体は ent の cmd/migrate (NamedDiff) で生成する設計なので、
// このファイルでは src を宣言せず、apply 用に migration dir だけ指す。
//
// dev URL は diff 計算には使われないが、atlas migrate apply の sanity check
// (lint, hash 整合性) のために docker://postgres を指定しておく。

env "local" {
  url = getenv("DATABASE_URL")
  dev = "docker://postgres/17/dev?search_path=public"
  migration {
    dir = "file://migrations"
  }
  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}
