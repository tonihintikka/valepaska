Feature: Challenge
  As a player
  I need to be able to challenge other players' claims
  So that I can catch liars and protect myself from bluffs

  Background:
    Given a game with 4 players
    And the game has been initialized with seed 12345

  @challenge
  Scenario: Challenge window opens after play
    Given it is player 1's turn
    When player 1 plays 2 cards claiming rank "7"
    Then the game phase should be "WAITING_FOR_CHALLENGES"
    And all other players should be able to challenge

  @challenge
  Scenario: No challenge - claim accepted
    Given player 1 has played 2 cards claiming rank "7"
    And the challenge window is open
    When no player challenges
    Then the claim should be accepted
    And the turn should advance to the next player

  @challenge @true-claim
  Scenario: Challenge fails - claim was true
    Given the table pile has 5 cards
    And player 1 plays 2 cards "7♥, 7♦" claiming rank "7"
    And the challenge window is open
    When player 2 challenges
    Then the played cards should be revealed
    And the claim should be verified as true
    And player 2 should pick up all 7 cards from the table
    And player 1 should continue with another turn
    And an event "CHALLENGE_RESOLVED" should be emitted with wasLie=false

  @challenge @false-claim
  Scenario: Challenge succeeds - claim was a lie
    Given the table pile has 5 cards
    And player 1 plays 2 cards "3♥, 4♦" claiming rank "7"
    And the challenge window is open
    When player 2 challenges
    Then the played cards should be revealed
    And the claim should be verified as a lie
    And player 1 should pick up all 7 cards from the table
    And the turn should advance to player 2
    And an event "CHALLENGE_RESOLVED" should be emitted with wasLie=true

  @challenge @priority
  Scenario: Challenge priority order
    Given player 1 has played cards claiming rank "7"
    And the challenge window is open
    And player 2 wants to challenge
    And player 3 wants to challenge
    And player 4 wants to challenge
    When challenges are processed
    Then player 2 should be the challenger
    And player 2 is next after player 1 in turn order

  @challenge @partial-lie
  Scenario: Partial lie - some cards match, some don't
    Given player 1 plays 3 cards "7♥, 7♦, 3♣" claiming rank "7"
    When player 2 challenges
    Then the claim should be verified as a lie
    And player 1 should pick up the table pile

  @challenge @wrong-count
  Scenario: Count mismatch is a lie
    Given player 1 plays 2 cards "7♥, 7♦" claiming rank "7" count 3
    When player 2 challenges
    Then the claim should be verified as a lie
    And player 1 should pick up the table pile

  @challenge @validation
  Scenario: Cannot challenge your own play
    Given player 1 has played cards claiming rank "7"
    And the challenge window is open
    When player 1 tries to challenge
    Then the challenge should be rejected with error "Cannot challenge your own play"

  @challenge @validation
  Scenario: Cannot challenge when no play has been made
    Given the game phase is "WAITING_FOR_PLAY"
    When player 2 tries to challenge
    Then the challenge should be rejected with error "No play to challenge"

  @challenge @endgame
  Scenario: Challenge on potential winning play
    Given the draw pile is empty
    And player 1 has 2 cards in hand
    When player 1 plays 2 cards claiming rank "A"
    Then the challenge window should be open
    And other players can still challenge before win is confirmed

  @challenge @endgame
  Scenario: Winning play challenged and was a lie
    Given the draw pile is empty
    And player 1 has 2 cards in hand
    And the table pile has 10 cards
    When player 1 plays 2 cards "3♥, 4♦" claiming rank "A"
    And player 2 challenges
    And the claim was a lie
    Then player 1 should pick up 12 cards
    And player 1 should not win
    And the game should continue

  @challenge @endgame
  Scenario: Winning play challenged and was true
    Given the draw pile is empty
    And player 1 has 2 cards in hand
    When player 1 plays 2 cards "A♥, A♦" claiming rank "A"
    And player 2 challenges
    And the claim was true
    Then player 2 should pick up the table pile
    And player 1 should have 0 cards
    And player 1 should be declared the winner

