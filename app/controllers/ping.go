package controllers

import (
	"bytes"
	"database/sql"
	"etcping_viewer/app/models/TimeSeries"
	"fmt"
	"github.com/revel/revel"
	"time"
)

type Ping struct {
	GorpController
}
type Alarm struct {
	IP      string
	Alias   sql.NullString
	DTStart sql.NullString
	Ticket  sql.NullString
	Hold    string
}

func (c *Ping) Alarms() revel.Result {
	var query = `
SELECT hosts.ip,
       hosts.alias,
	   alarms.dtStart,
       alarms.ticket,
       IF(alarms.hold, 1, 0) AS hold
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

func (c *Ping) SetHold(host string, state int) revel.Result {
	var query = `
UPDATE alarms SET hold = ? WHERE ip = ?
`
	_, err := c.Txn.Exec(query, state, host)
	if err != nil {
		return c.RenderError(err)
	}
	return c.RenderJson("OK")
}

type DBPingTimeSeries struct {
	Dt    string
	Value float64
}

func (c *Ping) PlotHistory(host string) revel.Result {
	var query = `
SELECT dt AS Dt,
       duration AS Value
FROM pingdata
WHERE host = ?
`
	results, err := c.Txn.Select(DBPingTimeSeries{}, query, host)
	if err != nil {
		return c.RenderError(err)
	}
	var ts TimeSeries.TimeSeries
	ts.NumColumns = 2
	ts.ColumnNames = []string{"Time", "Duration"}

	loc, _ := time.LoadLocation("America/Anchorage")
	for _, v := range results {
		val, ok := v.(*DBPingTimeSeries)
		if !ok {
			continue
		}
		tmp, err := time.ParseInLocation("2006-01-02 15:04:05", val.Dt, loc)
		if err != nil {
			fmt.Println(err)
			continue
		}
		dt := float64(tmp.UnixNano() / int64(time.Millisecond))
		ts.Data = append(ts.Data, TimeSeries.TimeSeriesData{Time: dt, Values: []float64{val.Value}})
	}
	var b bytes.Buffer
	err = ts.ToPng(&b, host+" Response Duration", 10, 5)
	if err != nil {
		return c.RenderError(err)
	}
	return c.RenderBinary(&b, "pic.png", revel.Inline, time.Now())
}
