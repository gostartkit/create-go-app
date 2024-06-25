# create-go-app

help you create go app with app-stub template.

### npx

```bash
npx create-go-app demo
```

### yarn

```bash
yarn create go-app demo
```

### pnpm

```bash
pnpm create go-app demo
```

```bash
pnpm dlx create-go-app demo
```

## demo app

a base app for RESTful API

## Gegetting started

### Build from source

```bash
go build -ldflags "-s -w" -buildmode=exe -tags release -o bin/demo
```

### Create config

```bash
bin/demo config
```

**Note**: Please modify config.json as you need.

### Start service

```bash
bin/demo serve
```

**Note**: Default config is use network: `unix`, you can change `network` to `tcp` and `addr` to `127.0.0.1:5000` for test.

### Create first code `cat.go` manual

1. create a model at dir `model/` name `cat.go`, ex: `model/cat.go`

```go title="model/cat.go"
package model

import (
	"time"
)

// NewCat return *Cat
func NewCat() *Cat {

	cat := &Cat{}

	return cat
}

// Cat model
// @Entity tableName="cats"
type Cat struct {
	// @PrimaryKey
	ID uint64 `json:"id"`
	// @DataType mysql=varchar(127)
	CatName string `json:"catName"`
	// @Comment "-1 deleted 0 pendding 1 valid"
	Status    int        `json:"status"`
	CreatedAt *time.Time `json:"createdAt"`
	UpdatedAt *time.Time `json:"updatedAt"`
}

// NewCats return *CatCollection
func NewCats() *CatCollection {

	cats := &CatCollection{}

	return cats
}

// CatCollection Cat list
type CatCollection []Cat

// Len return len
func (o *CatCollection) Len() int { return len(*o) }

// Swap swap i, j
func (o *CatCollection) Swap(i, j int) { (*o)[i], (*o)[j] = (*o)[j], (*o)[i] }

// Less compare i, j
func (o *CatCollection) Less(i, j int) bool { return (*o)[i].ID < (*o)[j].ID }
```

2. update `model/model_pool.go`

```go title="model/model_pool.go"
package model

import "sync"

var (
	_catPool = sync.Pool{
		New: func() any {
			return NewCat()
		}}

	_authPool = sync.Pool{
		New: func() any {
			return NewAuth()
		}}
)

// CreateCat return *Cat
func CreateCat() *Cat {

	cat := _catPool.Get().(*Cat)

	return cat
}

func (o *Cat) initial() {
	o.ID = 0
	o.CatName = ""
	o.Status = 0
	o.CreatedAt = nil
	o.UpdatedAt = nil
}

func (o *Cat) Release() {
	o.initial()
	_catPool.Put(o)
}

// CreateCats return *CatCollection
func CreateCats(pageSize int) *CatCollection {

	cats := make(CatCollection, 0, pageSize)

	return &cats
}

func (o *CatCollection) Release() {
	for i := 0; i < len(*o); i++ {
		(*o)[i].Release()
	}
}

// CreateAuth return *Auth
func CreateAuth() *Auth {

	auth := _authPool.Get().(*Auth)

	return auth
}

func (o *Auth) initial() {
	o.UserID = 0
	o.UserRight = 0
}

func (o *Auth) Release() {
	o.initial()
	_authPool.Put(o)
}

// CreateAuthes return *AuthCollection
func CreateAuthes(pageSize int) *AuthCollection {

	authes := make(AuthCollection, 0, pageSize)

	return &authes
}

func (o *AuthCollection) Release() {
	for i := 0; i < len(*o); i++ {
		(*o)[i].Release()
	}
}
```

3. update your `config/rbac.go`, add ReadCat, WriteCat to it.

```go title="config/rbac.go"
package config

import (
	"sort"
	"strings"
)

const (
	Read int64 = 1 << iota
	Write
	ReadCat
	WriteCat
)

// CreateRbacConfig return *RightCollection
func CreateRbacConfig() *RightCollection {

	cfg := &RightCollection{
		{
			Key:   rightKey(ReadCat),
			Value: ReadCat,
		},
		{
			Key:   rightKey(WriteCat),
			Value: WriteCat,
		},
	}

	sort.Sort(cfg)

	return cfg
}

// Right struct
type Right struct {
	Key   string `json:"key"`
	Value int64  `json:"value"`
}

// RightCollection struct
type RightCollection []Right

// Len return len
func (o *RightCollection) Len() int { return len(*o) }

// Swap swap i, j
func (o *RightCollection) Swap(i, j int) { (*o)[i], (*o)[j] = (*o)[j], (*o)[i] }

// Less compare i, j
func (o *RightCollection) Less(i, j int) bool { return (*o)[i].Key < (*o)[j].Key }

// Search uses binary search to find and return the smallest index Value
func (o *RightCollection) Search(key string) int64 {

	i := sort.Search(o.Len(), func(i int) bool { return (*o)[i].Key >= key })

	if i < o.Len() && (*o)[i].Key == key {
		return (*o)[i].Value
	}

	return 0
}

// Sum sum right.value
func (o *RightCollection) Sum() int64 {
	var val int64 = 0
	for i := 0; i < o.Len(); i++ {
		val += (*o)[i].Value
	}
	return val
}

// Keys get keys by userRight
func (o *RightCollection) Keys(userRight int64) string {
	var sb strings.Builder
	for i := 0; i < o.Len(); i++ {
		if (*o)[i].Value&userRight > 0 {
			if sb.Len() > 0 {
				sb.WriteByte(',')
			}
			sb.WriteString((*o)[i].Key)
		}
	}
	return sb.String()
}

func rightKey(val int64) string {
	switch val {
	case Read:
		return "read"
	case Write:
		return "write"
	case ReadCat:
		return "cat.read"
	case WriteCat:
		return "cat.write"
	default:
		return ""
	}
}

```

4. create `contract/cat.go`

```go title="contract/cat.go"
package contract

import "app.gostartkit.com/go/demo/model"

// CatRepository interface
type CatRepository interface {
	// CreateCatID return cat.ID error
	CreateCatID() (uint64, error)
	// GetCats return *model.CatCollection, error
	GetCats(filter string, orderBy string, page int, pageSize int) (*model.CatCollection, error)
	// GetCat return *model.Cat, error
	GetCat(id uint64) (*model.Cat, error)
	// CreateCat return int64, error
	// Attributes: ID uint64, CatName string, Status int
	CreateCat(cat *model.Cat) (int64, error)
	// UpdateCat return int64, error
	// Attributes: CatName string, Status int
	UpdateCat(cat *model.Cat) (int64, error)
	// PatchCat return int64, error
	// Attributes: CatName string, Status int
	PatchCat(cat *model.Cat, attrsName ...string) (int64, error)
	// UpdateCatStatus return int64, error
	// Attributes: Status int
	UpdateCatStatus(cat *model.Cat) (int64, error)
	// DestroyCat return int64, error
	DestroyCat(id uint64) (int64, error)
	// DestroyCat return int64, error
	DestroyCatSoft(id uint64) (int64, error)
}
```

5. create `repository/cat.go`

```go title="repository/cat.go"
import (
	"database/sql"
	"fmt"
	"reflect"
	"strings"
	"sync"
	"sync/atomic"

	"app.gostartkit.com/go/demo/config"
	"app.gostartkit.com/go/demo/contract"
	"app.gostartkit.com/go/demo/model"
	"pkg.gostartkit.com/utils"
	"pkg.gostartkit.com/web"
)

var (
	_catRepository     contract.CatRepository
	_onceCatRepository sync.Once
)

// CreateCatRepository return contract.CatRepository
func CreateCatRepository() contract.CatRepository {

	_onceCatRepository.Do(func() {
		_catRepository = &CatRepository{}
	})

	return _catRepository
}

// CatRepository struct
type CatRepository struct {
	mu    sync.Mutex
	catID uint64
}

// CreateCatID return cat.ID error
func (r *CatRepository) CreateCatID() (uint64, error) {
	r.mu.Lock()
	if r.catID == 0 {
		var err error
		r.catID, err = max("cats", "id", config.App().AppID, config.App().AppNum)
		if err != nil {
			r.mu.Unlock()
			return 0, err
		}
		if r.catID == 0 {
			r.catID = config.App().AppID - config.App().AppNum
		}
	}
	r.mu.Unlock()
	catID := atomic.AddUint64(&r.catID, config.App().AppNum)
	return catID, nil
}

// GetCats return *model.CatCollection, error
func (r *CatRepository) GetCats(filter string, orderBy string, page int, pageSize int) (*model.CatCollection, error) {

	var sqlx strings.Builder
	var args []any

	sqlx.WriteString("SELECT `id`, `cat_name`, `status`, `created_at`, `updated_at` ")
	sqlx.WriteString("FROM `cats` ")
	sqlx.WriteString("WHERE `status` >= 0 ")

	if filter != "" {
		sqlx.WriteString("AND ")
		if err := utils.SqlFilter(filter, &sqlx, &args, "", r.tryParse); err != nil {
			return nil, err
		}
		sqlx.WriteString(" ")
	}

	if orderBy != "" {
		sqlx.WriteString("ORDER BY ")
		if err := utils.SqlOrderBy(orderBy, &sqlx, "", r.tryParseKey); err != nil {
			return nil, err
		}
		sqlx.WriteString(" ")
	}

	sqlx.WriteString("limit ? offset ?")

	if pageSize > _maxPageSize {
		pageSize = _maxPageSize
	} else if pageSize <= 0 {
		pageSize = _pageSize
	}

	offset := 0

	if page > 1 {
		offset = (page - 1) * pageSize
	}

	args = append(args, pageSize, offset)

	rows, err := query(sqlx.String(), args...)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	cats := model.CreateCats(pageSize)

	for rows.Next() {

		cat := model.CreateCat()

		err := rows.Scan(&cat.ID, &cat.CatName, &cat.Status, &cat.CreatedAt, &cat.UpdatedAt)

		if err != nil {
			cat.Release()
			cats.Release()
			return nil, err
		}

		*cats = append(*cats, *cat)
	}

	return cats, rows.Err()
}

// GetCat return *model.Cat, error
func (r *CatRepository) GetCat(id uint64) (*model.Cat, error) {

	sqlx := "SELECT `id`, `cat_name`, `status`, `created_at`, `updated_at` " +
		"FROM `cats` " +
		"WHERE `id` = ? AND `status` >= 0"

	row := queryRow(sqlx, id)

	cat := model.CreateCat()

	err := row.Scan(&cat.ID, &cat.CatName, &cat.Status, &cat.CreatedAt, &cat.UpdatedAt)

	if err != nil {
		cat.Release()
		if err == sql.ErrNoRows {
			return nil, web.ErrNotFound
		}
		return nil, err
	}

	return cat, nil
}

// CreateCat return int64, error
// Attributes: ID uint64, CatName string, Status int
func (r *CatRepository) CreateCat(cat *model.Cat) (int64, error) {

	sqlx := "INSERT INTO `cats` " +
		"(`id`, `cat_name`, `status`, `created_at`) " +
		"VALUES(?, ?, ?, ?)"

	var err error

	if cat.ID == 0 {

		cat.ID, err = r.CreateCatID()

		if err != nil {
			return 0, err
		}
	}

	cat.CreatedAt = now()

	result, err := exec(sqlx, cat.ID, cat.CatName, cat.Status, cat.CreatedAt)

	if err != nil {
		return 0, err
	}

	rowsAffected, err := result.RowsAffected()

	if err != nil {
		return 0, err
	}

	return rowsAffected, nil
}

// UpdateCat return int64, error
// Attributes: CatName string, Status int
func (r *CatRepository) UpdateCat(cat *model.Cat) (int64, error) {

	sqlx := "UPDATE `cats` " +
		"SET `cat_name` = ?, `status` = ?, `updated_at` = ? " +
		"WHERE `id` = ?"

	cat.UpdatedAt = now()

	result, err := exec(sqlx, cat.CatName, cat.Status, cat.UpdatedAt, cat.ID)

	if err != nil {
		return 0, err
	}

	rowsAffected, err := result.RowsAffected()

	if err != nil {
		return 0, err
	}

	return rowsAffected, nil
}

// PatchCat return int64, error
// Attributes: CatName string, Status int
func (r *CatRepository) PatchCat(cat *model.Cat, attrsName ...string) (int64, error) {

	var sqlx strings.Builder
	var args []any

	rv := reflect.Indirect(reflect.ValueOf(cat))

	sqlx.WriteString("UPDATE `cats` SET ")

	for i, n := range attrsName {

		columnName, attributeName, _, err := r.tryParseKey(n)

		if err != nil {
			return 0, err
		}

		if i > 0 {
			sqlx.WriteString(", ")
		}

		fmt.Fprintf(&sqlx, "`%s` = ?", columnName)

		v := rv.FieldByName(attributeName).Interface()

		args = append(args, v)
	}

	sqlx.WriteString(", `updated_at` = ?")

	cat.UpdatedAt = now()

	args = append(args, cat.UpdatedAt)

	sqlx.WriteString(" WHERE `id` = ?")

	args = append(args, cat.ID)

	result, err := exec(sqlx.String(), args...)

	if err != nil {
		return 0, err
	}

	rowsAffected, err := result.RowsAffected()

	if err != nil {
		return 0, err
	}

	return rowsAffected, nil
}

// UpdateCatStatus return int64, error
// Attributes: Status int
func (r *CatRepository) UpdateCatStatus(cat *model.Cat) (int64, error) {

	sqlx := "UPDATE `cats` " +
		"SET `status` = ?, `updated_at` = ? " +
		"WHERE `id` = ?"

	cat.UpdatedAt = now()

	result, err := exec(sqlx, cat.Status, cat.UpdatedAt, cat.ID)

	if err != nil {
		return 0, err
	}

	rowsAffected, err := result.RowsAffected()

	if err != nil {
		return 0, err
	}

	return rowsAffected, nil
}

// DestroyCat return int64, error
func (r *CatRepository) DestroyCat(id uint64) (int64, error) {

	sqlx := "DELETE FROM `cats` WHERE `id` = ?"

	result, err := exec(sqlx, id)

	if err != nil {
		return 0, err
	}

	rowsAffected, err := result.RowsAffected()

	if err != nil {
		return 0, err
	}

	return rowsAffected, nil
}

// DestroyCat return int64, error
func (r *CatRepository) DestroyCatSoft(id uint64) (int64, error) {

	sqlx := "UPDATE `cats` " +
		"SET `status` = -ABS(`status`) " +
		"WHERE `id` = ?"

	result, err := exec(sqlx, id)

	if err != nil {
		return 0, err
	}

	rowsAffected, err := result.RowsAffected()

	if err != nil {
		return 0, err
	}

	return rowsAffected, nil
}

// tryParse return columnName, attributeValue, error
func (r *CatRepository) tryParse(key string, val string) (string, any, error) {

	columnName, _, attributeType, err := r.tryParseKey(key)

	if err != nil {
		return "", nil, err
	}

	v, err := utils.TryParse(val, attributeType)

	if err != nil {
		return "", nil, err
	}

	return columnName, v, nil
}

// tryParseKey return columnName, attributeName, attributeType, error
func (r *CatRepository) tryParseKey(key string) (string, string, string, error) {

	switch key {
	case "id", "ID":
		return "id", "ID", "uint64", nil
	case "catName", "CatName":
		return "cat_name", "CatName", "string", nil
	case "status", "Status":
		return "status", "Status", "int", nil
	case "createdAt", "CreatedAt":
		return "created_at", "CreatedAt", "*time.Time", nil
	case "updatedAt", "UpdatedAt":
		return "updated_at", "UpdatedAt", "*time.Time", nil
	default:
		return "", "", "", fmt.Errorf("'cat.%s' not exists", key)
	}
}
```

6. create `proxy/cat.go`

```go title="proxy/cat.go"
package proxy

import (
	"app.gostartkit.com/go/demo/model"
	"app.gostartkit.com/go/demo/repository"
)

var (
	catRepository = repository.CreateCatRepository()
)

// CreateCatID return cat.ID error
func CreateCatID() (uint64, error) {
	return catRepository.CreateCatID()
}

// GetCats return *model.CatCollection, error
func GetCats(filter string, orderBy string, page int, pageSize int) (*model.CatCollection, error) {
	return catRepository.GetCats(filter, orderBy, page, pageSize)
}

// GetCat return *model.Cat, error
func GetCat(id uint64) (*model.Cat, error) {
	return catRepository.GetCat(id)
}

// CreateCat return int64, error
// Attributes: ID uint64, CatName string, Status int
func CreateCat(cat *model.Cat) (int64, error) {
	return catRepository.CreateCat(cat)
}

// UpdateCat return int64, error
// Attributes: CatName string, Status int
func UpdateCat(cat *model.Cat) (int64, error) {
	return catRepository.UpdateCat(cat)
}

// PatchCat return int64, error
// Attributes: CatName string, Status int
func PatchCat(cat *model.Cat, attrsName ...string) (int64, error) {
	return catRepository.PatchCat(cat, attrsName...)
}

// UpdateCatStatus return int64, error
// Attributes: Status int
func UpdateCatStatus(cat *model.Cat) (int64, error) {
	return catRepository.UpdateCatStatus(cat)
}

// DestroyCat return int64, error
func DestroyCat(id uint64) (int64, error) {
	return catRepository.DestroyCat(id)
}

// DestroyCat return int64, error
func DestroyCatSoft(id uint64) (int64, error) {
	return catRepository.DestroyCatSoft(id)
}
```
7. create `validator/cat.go`

```go title="validator/cat.go"
package validator

import (
	"app.gostartkit.com/go/demo/model"
)

// CreateCat validate create cat
func CreateCat(cat *model.Cat) error {

	if cat.CatName == "" {
		return createRequiredError("catName")
	}

	return nil
}

// UpdateCat validate update cat
func UpdateCat(cat *model.Cat) error {

	if cat.ID == 0 {
		return createRequiredError("id")
	}

	return nil
}

// PatchCat validate update cat part
func PatchCat(cat *model.Cat, attrsName ...string) error {

	if cat.ID == 0 {
		return createRequiredError("id")
	}

	if len(attrsName) == 0 {
		return createRequiredError("attrs")
	}

	return nil
}

// UpdateCatStatus validate update cat status
func UpdateCatStatus(cat *model.Cat) error {

	if cat.ID == 0 {
		return createRequiredError("id")
	}

	return nil
}
```

8. create `controller/cat.go`

```go title="controller/cat.go"
package controller

import (
	"sync"

	"app.gostartkit.com/go/demo/model"
	"app.gostartkit.com/go/demo/proxy"
	"app.gostartkit.com/go/demo/validator"
	"pkg.gostartkit.com/utils"
	"pkg.gostartkit.com/web"
)

var (
	_catController     *CatController
	_onceCatController sync.Once
)

// CreateCatController return *CatController
func CreateCatController() *CatController {

	_onceCatController.Do(func() {
		_catController = &CatController{}
	})

	return _catController
}

// CatController struct
type CatController struct {
}

// Index get cats
func (r *CatController) Index(c *web.Ctx) (any, error) {

	filter := c.QueryFilter()
	orderBy := c.QueryOrderBy()
	page := c.QueryPage(_defaultPage)
	pageSize := c.QueryPageSize(_defaultPageSize)

	return proxy.GetCats(filter, orderBy, page, pageSize)
}

// Detail get cat
func (r *CatController) Detail(c *web.Ctx) (any, error) {

	id, err := c.ParamUint64("id")

	if err != nil {
		return nil, err
	}

	if err := utils.Uint64("id", id); err != nil {
		return nil, err
	}

	return proxy.GetCat(id)
}

// CreateID create cat.ID
func (r *CatController) CreateID(c *web.Ctx) (any, error) {
	return proxy.CreateCatID()
}

// Create create cat
func (r *CatController) Create(c *web.Ctx) (any, error) {

	cat := model.CreateCat()
	defer cat.Release()

	if err := c.TryParseBody(cat); err != nil {
		return nil, err
	}

	if err := validator.CreateCat(cat); err != nil {
		return nil, err
	}

	if _, err := proxy.CreateCat(cat); err != nil {
		return nil, err
	}

	return cat.ID, nil
}

// Update update cat
func (r *CatController) Update(c *web.Ctx) (any, error) {

	var err error

	cat := model.CreateCat()
	defer cat.Release()

	if err = c.TryParseBody(cat); err != nil {
		return nil, err
	}

	if cat.ID, err = c.ParamUint64("id"); err != nil {
		return nil, err
	}

	if err = validator.UpdateCat(cat); err != nil {
		return nil, err
	}

	return proxy.UpdateCat(cat)
}

// Patch update cat
func (r *CatController) Patch(c *web.Ctx) (any, error) {

	attrs := c.HeaderAttrs()

	if attrs == nil {
		return nil, validator.ErrAttrsHeaderRequired
	}

	var err error

	cat := model.CreateCat()
	defer cat.Release()

	if err = c.TryParseBody(cat); err != nil {
		return nil, err
	}

	if cat.ID, err = c.ParamUint64("id"); err != nil {
		return nil, err
	}

	if err = validator.PatchCat(cat, attrs...); err != nil {
		return nil, err
	}

	return proxy.PatchCat(cat, attrs...)
}

// UpdateStatus update cat.Status
func (r *CatController) UpdateStatus(c *web.Ctx) (any, error) {

	var err error

	cat := model.CreateCat()
	defer cat.Release()

	if err = c.TryParseBody(cat); err != nil {
		return nil, err
	}

	if cat.ID, err = c.ParamUint64("id"); err != nil {
		return nil, err
	}

	if err = validator.UpdateCatStatus(cat); err != nil {
		return nil, err
	}

	return proxy.UpdateCatStatus(cat)
}

// Destroy delete cat
func (r *CatController) Destroy(c *web.Ctx) (any, error) {

	id, err := c.ParamUint64("id")

	if err != nil {
		return nil, err
	}

	if err := utils.Uint64("id", id); err != nil {
		return nil, err
	}

	return proxy.DestroyCatSoft(id)
}
```

9. create `route/cat.go`

```go title="route/cat.go"
package route

import (
	"app.gostartkit.com/go/demo/config"
	"app.gostartkit.com/go/demo/controller"
	"app.gostartkit.com/go/demo/middleware"
	"pkg.gostartkit.com/web"
)

func catRoute(app *web.Application, prefix string) {

	c := controller.CreateCatController()

	app.Get(prefix+"/cat/", middleware.Chain(c.Index, config.Read|config.ReadCat))
	app.Get(prefix+"/cat/:id", middleware.Chain(c.Detail, config.Read|config.ReadCat))
	app.Post(prefix+"/apply/cat/id/", middleware.Chain(c.CreateID, config.Write|config.WriteCat))
	app.Post(prefix+"/cat/", middleware.Chain(c.Create, config.Write|config.WriteCat))
	app.Put(prefix+"/cat/:id", middleware.Chain(c.Update, config.Write|config.WriteCat))
	app.Patch(prefix+"/cat/:id", middleware.Chain(c.Patch, config.Write|config.WriteCat))
	app.Patch(prefix+"/cat/:id/status/", middleware.Chain(c.UpdateStatus, config.Write|config.WriteCat))
	app.Delete(prefix+"/cat/:id", middleware.Chain(c.Destroy, config.Write|config.WriteCat))
}
```

10. update `route/route.go`, call catRoute(app, _prefix)

```go title="route/route.go"
package route

import (
	"sync"

	"pkg.gostartkit.com/web"
)

var (
	_once   sync.Once
	_prefix string
)

// Init route init
func Init(app *web.Application) {
	_once.Do(func() {
		dataRoute(app, _prefix)
		catRoute(app, _prefix)
	})
}
```

11. update database with sql

```sql
CREATE TABLE `cats` (
  `id` bigint(20) unsigned NOT NULL,
  `cat_name` varchar(127) NOT NULL,
  `status` int(10) NOT NULL COMMENT '-1 deleted 0 pendding 1 valid',
  `created_at` timestamp NULL,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`id`)
);
```

### Create first code `cat.go` by `gskctl`

`gskctl` [Getting Started](https://gostartkit.com/docs/getting-started/)

1. create `model/cat.go`

```bash
gsk model cat
```

2. update `config/rbac.go`

```bash
gsk config
```

3. create code

```bash
gsk code
```

4. create sql

```bash
gsk db sql
```