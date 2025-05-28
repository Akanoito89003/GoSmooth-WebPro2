package utils

func IsValidPassword(password string) bool {
	if len(password) < 7 {
		return false
	}
	hasLetter := false
	for _, c := range password {
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') {
			hasLetter = true
			break
		}
	}
	return hasLetter
}
