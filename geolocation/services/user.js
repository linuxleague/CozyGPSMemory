import { getUniqueId } from 'react-native-device-info'

import {
  StorageKeys,
  storeData,
  getData
} from '../../src/libs/localStorage/storage'
import { Log } from '../helpers'

const useUniqueDeviceId = false
const serverURL = 'https://openpath.cozycloud.cc'

export const getId = async () => {
  try {
    let value = await getData(StorageKeys.IdStorageAdress)
    if (value == undefined) {
      Log('No current Id, generating a new one...')
      value = useUniqueDeviceId
        ? await getUniqueId()
        : Math.random().toString(36).replace('0.', '')
      await storeId(value) // random Id or device Id depending on config
      if (value != (await getData(StorageKeys.IdStorageAdress))) {
        throw new Error("New Id couldn't be stored") // We make sure it is stored
      }
      Log('Set Id to: ' + value)
    }

    return value
  } catch (error) {
    Log('Error while getting Id:' + error.toString())
    throw error
  }
}

export const createUser = async user => {
  let response = await fetch(serverURL + '/profile/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user: user })
  })
  if (!response.ok) {
    Log('Error creating user: ' + response.status + ' ' + response.statusText)
    throw new Error('FAILED_EMISSION_USER_CREATION') // Could be no Internet, offline server or unknown issue. Won't trigger if user already exists.
  } else {
    const jsonTokenResponse = await response.json()
    Log('Success creating user ' + user + ', UUID: ' + jsonTokenResponse.uuid)
  }
}

export const updateId = async newId => {
  // If there are still non-uploaded locations, it should be handled before changing the Id or they will be sent with the new one
  Log('Updating Id to ' + newId)

  if (newId.length > 2 && newId != (await getId())) {
    await storeId(newId)
    if (newId != (await getId())) {
      return 'FAIL_STORING_ID'
    }
    try {
      await createUser(newId)
      return 'SUCCESS_STORING_SUCCESS_CREATING'
    } catch (error) {
      return 'SUCCESS_STORING_FAIL_CREATING'
    }
  } else {
    return 'SAME_ID_OR_INVALID_ID'
  }
}

export const storeId = async Id => {
  await storeData(StorageKeys.IdStorageAdress, Id)
}
