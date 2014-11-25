package controllers

import (
	//"fmt"
	"database/sql"
	"github.com/revel/revel"
)

type Ping struct {
	GorpController
}
type Alarm struct {
	IP      string
	Alias   sql.NullString
	DTStart sql.NullString
	Ticket  sql.NullString
}

func (c *Ping) Alarms() revel.Result {
	var query = `
SELECT hosts.ip,
       hosts.alias,
	   alarms.dtStart,
       alarms.ticket
FROM alarms
LEFT JOIN hosts
ON hosts.ip = alarms.ip
WHERE primary_alias = 1
AND alarms.dtEnd IS NULL
`
	results, err := c.Txn.Select(Alarm{}, query)
	if err != nil {
		return c.RenderError(err)
	}

	return c.RenderJson(results)
}
