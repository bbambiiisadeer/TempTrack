import { eq } from "drizzle-orm";
import { dbClient, dbConn } from "@db/client.js";
import { users, address, parcel } from "@db/schema.js";

async function insertUser() {
  await dbClient.insert(users).values({
    name: "Bambam",
    email: "bam@mail.com",
    password: "5678",
  });
  dbConn.end();
}

async function queryUsers() {
  const results = await dbClient.query.users.findMany();
  console.log(results);
  dbConn.end();
}

async function updateUser() {
  const results = await dbClient.query.users.findMany();
  if (results.length === 0) dbConn.end();

  const id = results[0].id;
  await dbClient
    .update(users)
    .set({
      name: "Updated Name",
    })
    .where(eq(users.id, id));
  dbConn.end();
}

async function deleteUser() {
  const results = await dbClient.query.users.findMany();
  if (results.length === 0) dbConn.end();

  const id = results[0].id;
  await dbClient.delete(users).where(eq(users.id, id));
  dbConn.end();
}

async function insertAddress(userId: string) {
  await dbClient.insert(address).values({
    userId,
    name: "amour",
    company: "ABC Food",
    email: "mommam@mail.com",
    phoneNumber: "0123456789",
    type: "sender",
    address: "123 Sukhumvit Rd, Bangkok",
    city: "Bangkok",
    state: "Bangkok",
    postalCode: "10110",
  });
  dbConn.end();
}

async function queryAddress() {
  const results = await dbClient.query.address.findMany();
  console.log(results);
  dbConn.end();
}

async function insertParcel(senderAddressId: string, recipientAddressId: string) {
  await dbClient.insert(parcel).values({
    senderAddressId,
    recipientAddressId,
    parcelName: "cat food",
    quantity: 2,
    weight: 15.5,
    dimensionLength: 40,
    dimensionWidth: 30,
    dimensionHeight: 25,
    temperatureRangeMin: -2,
    temperatureRangeMax: -0.5,
    allowedDeviation: 2,
    specialNotes: "Handle with care",
  });
  dbConn.end();
}

async function queryParcel() {
  const results = await dbClient.query.parcel.findMany();
  console.log(results);
  dbConn.end();
}

// insertUser();
queryUsers();
// updateUser();
// deleteUser();