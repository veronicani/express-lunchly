"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
        [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get a customer by name. */

  static async getByName(name) {
    // const caseName = name.toLowerCase();
    const results = await db.query(
      // `SELECT concat(first_name,' ',last_name) as full_name
      //     FROM customers
      //     WHERE concat(first_name, last_name) ilike '%$1%'`,

          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
          FROM customers
          WHERE concat(first_name, ' ', last_name) ilike $1
          ORDER BY last_name, first_name`,
        [`%${ name }%`],
    );

    return results.rows.map(c => new Customer(c));
  }

  /** Get top ten customers with most reservations ordered by # of reservations */

  static async getTopTenCustomers(){
    const results = await db.query(
      `SELECT r.customer_id, COUNT(*),
              c.first_name AS "firstName",
              c.last_name AS "lastName",
              c.phone,
              c.notes
            FROM reservations as r
                JOIN customers AS c ON (r.customer_id = c.id)
            GROUP BY r.customer_id, c.first_name, c.last_name, c.phone, c.notes
            ORDER BY COUNT(*) desc
            LIMIT (10);`
    );

    console.log("*** results: ", results);

    // [ {customer_id: x, count: y} ... ]


    return results.rows.map(c => new Customer(c));

  }


  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  /** Returns first and last names joined by a space (for now ...) */

  fullName(){
    return `${this.firstName} ${this.lastName}`

    // const veronica = new Customer(Veronica, Ni, 7,)
    // veronica.fullName()
    // => "Veronica Ni"
  }

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
            this.firstName,
            this.lastName,
            this.phone,
            this.notes,
            this.id,
          ],
      );
    }
  }
}

module.exports = Customer;
