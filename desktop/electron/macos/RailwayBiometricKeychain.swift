import Foundation
import LocalAuthentication
import Security

private let service = "com.railway.rtp.biometric-unlock"
private let account = "wallet-database-key-v1"
private let authenticationReason = "Unlock Railway Wallet"

private enum ExitCode: Int32 {
  case invalidRequest = 2
  case cancelled = 10
  case authenticationFailed = 11
  case itemNotFound = 12
  case unavailable = 13
  case keychainFailure = 14
}

private func finish(_ code: ExitCode, message: String? = nil) -> Never {
  if let message {
    FileHandle.standardError.write(Data(message.utf8))
  }
  exit(code.rawValue)
}

private func baseQuery() -> [String: Any] {
  [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrService as String: service,
    kSecAttrAccount as String: account,
    kSecUseDataProtectionKeychain as String: true,
  ]
}

private func touchIDAvailable() -> Bool {
  let context = LAContext()
  var error: NSError?
  guard context.canEvaluatePolicy(
    .deviceOwnerAuthenticationWithBiometrics,
    error: &error
  ) else {
    return false
  }
  return context.biometryType == .touchID
}

private func strongProtectionAvailable() -> Bool {
  guard let task = SecTaskCreateFromSelf(nil) else {
    return false
  }
  guard
    let applicationIdentifier = SecTaskCopyValueForEntitlement(
      task,
      "com.apple.application-identifier" as CFString,
      nil
    ) as? String,
    let accessGroups = SecTaskCopyValueForEntitlement(
      task,
      "keychain-access-groups" as CFString,
      nil
    ) as? [String]
  else {
    return false
  }
  return accessGroups.contains(applicationIdentifier)
}

private func itemExists() -> Bool {
  var query = baseQuery()
  query[kSecReturnAttributes as String] = true
  query[kSecMatchLimit as String] = kSecMatchLimitOne
  query[kSecUseAuthenticationUI as String] = kSecUseAuthenticationUIFail

  let status = SecItemCopyMatching(query as CFDictionary, nil)
  return status == errSecSuccess || status == errSecInteractionNotAllowed
}

private func printStatus() {
  let available = touchIDAvailable()
  let enrolled = itemExists()
  let strongProtection = strongProtectionAvailable()
  let output =
    "{\"available\":\(available),\"enrolled\":\(enrolled),\"strongProtection\":\(strongProtection)}"
  FileHandle.standardOutput.write(Data(output.utf8))
}

private func deleteItem() {
  let status = SecItemDelete(baseQuery() as CFDictionary)
  guard status == errSecSuccess || status == errSecItemNotFound else {
    finish(.keychainFailure)
  }
}

private func storeItem() {
  guard touchIDAvailable() else {
    finish(.unavailable)
  }

  let secret = FileHandle.standardInput.readDataToEndOfFile()
  guard secret.count > 0, secret.count <= 128 else {
    finish(.invalidRequest)
  }

  guard
    let secretString = String(data: secret, encoding: .utf8),
    secretString.range(
      of: "^[0-9a-fA-F]{64}$",
      options: .regularExpression
    ) != nil
  else {
    finish(.invalidRequest)
  }

  var accessControlError: Unmanaged<CFError>?
  guard let accessControl = SecAccessControlCreateWithFlags(
    nil,
    kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
    .biometryCurrentSet,
    &accessControlError
  ) else {
    finish(.keychainFailure)
  }

  deleteItem()

  var query = baseQuery()
  query[kSecValueData as String] = secret
  query[kSecAttrAccessControl as String] = accessControl

  guard SecItemAdd(query as CFDictionary, nil) == errSecSuccess else {
    finish(.keychainFailure)
  }
}

private func retrieveItem() {
  guard touchIDAvailable() else {
    finish(.unavailable)
  }

  let context = LAContext()
  context.localizedReason = authenticationReason
  context.localizedCancelTitle = "Use Railway password"
  context.touchIDAuthenticationAllowableReuseDuration = 0

  var query = baseQuery()
  query[kSecReturnData as String] = true
  query[kSecMatchLimit as String] = kSecMatchLimitOne
  query[kSecUseAuthenticationContext as String] = context

  var result: CFTypeRef?
  let status = SecItemCopyMatching(query as CFDictionary, &result)

  switch status {
  case errSecSuccess:
    guard let secret = result as? Data else {
      finish(.keychainFailure)
    }
    FileHandle.standardOutput.write(secret)
  case errSecUserCanceled:
    finish(.cancelled)
  case errSecAuthFailed:
    finish(.authenticationFailed)
  case errSecItemNotFound:
    finish(.itemNotFound)
  case errSecInteractionNotAllowed:
    finish(.unavailable)
  default:
    finish(.keychainFailure)
  }
}

guard CommandLine.arguments.count == 2 else {
  finish(.invalidRequest)
}

switch CommandLine.arguments[1] {
case "status":
  printStatus()
case "store":
  storeItem()
case "retrieve":
  retrieveItem()
case "delete":
  deleteItem()
default:
  finish(.invalidRequest)
}
